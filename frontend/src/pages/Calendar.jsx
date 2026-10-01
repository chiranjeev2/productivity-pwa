import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { getApiUrl } from '../utils/apiConfig';

const Calendar = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { networkStatus, getSnapshot, saveSnapshot } = useSync();
  
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0);
  
  const API_URL = getApiUrl();
  const isLive = networkStatus === 'live';

  const fetchCalendarData = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);

    // 1. Instant snapshot load
    const cached = getSnapshot('calendar_logs');
    if (cached) setLogs(cached);

    if (!isLive) {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_URL}/calendar`, { headers: { 'Authorization': `Bearer ${token}` }});
      
      if (res.status === 401) {
        window.dispatchEvent(new Event('auth-unauthorized'));
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        saveSnapshot('calendar_logs', data);
      }
    } catch(e) {
      console.error("Calendar fetch failed quietly", e);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, user, isLive, getSnapshot, saveSnapshot]);

  // Fetches only on mount or user state change
  useEffect(() => {
    if (user) fetchCalendarData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Background poll and reactive sync listener
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (networkStatus === 'live') fetchCalendarData(false);
    }, 5000);

    const handleSync = () => {
      setTick(t => t + 1); // Force re-render to evaluate local edge snapshots
      if (networkStatus === 'live') fetchCalendarData(false);
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('sync-complete', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('sync-complete', handleSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, networkStatus, fetchCalendarData]);

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  // Generate Current Month Grid
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const monthName = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const gridDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dailyLog = logs.find(l => l.dateString === dateString);
    gridDays.push({ day: i, dateString, log: dailyLog });
  }

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>📅 Calendar</h1>
        <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{monthName}</p>
      </div>

      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}`, marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
          
          {/* Calendar Headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} style={{ fontWeight: 'bold', color: isDarkMode ? '#94a3b8' : '#64748b', paddingBottom: '10px' }}>
              {day}
            </div>
          ))}

          {/* Blank spaces for the first day offset */}
          {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, idx) => (
            <div key={`blank-${idx}`} />
          ))}

          {/* Calendar Days */}
          {gridDays.map(({ day, dateString, log }) => {
            const isToday = dateString === todayString;
            
            // Client-Side Edge Computing Interceptor (ProdPro v2.1 Architecture)
            let cellStatus = 'none';
            let cellWater = 0;
            let cellTasksCompleted = 0;
            let cellTotalTasks = 0;

            if (isToday) {
              // Edge computing interceptor reads directly from localStorage snapshots
              const localTasks = getSnapshot('tasks') || [];
              const localWater = getSnapshot(`water_${todayString}`) || 0;
              cellTotalTasks = localTasks.length;
              cellTasksCompleted = localTasks.filter(t => t.completed).length;
              cellWater = localWater;

              const waterGoalMet = localWater >= 8;
              const tasksGoalMet = cellTotalTasks > 0 ? cellTasksCompleted === cellTotalTasks : true;

              if (localWater > 0 || cellTasksCompleted > 0) {
                if (waterGoalMet && tasksGoalMet) cellStatus = 'perfect';
                else cellStatus = 'good';
              }
            } else if (log) {
              cellWater = log.waterIntake || 0;
              cellTasksCompleted = log.tasksCompleted || 0;
              cellTotalTasks = log.totalTasks || 0;
              if (log.status === 'perfect' || (cellWater >= 8 && (cellTotalTasks > 0 ? cellTasksCompleted === cellTotalTasks : true))) {
                cellStatus = 'perfect';
              } else if (log.status === 'good' || cellWater > 0 || cellTasksCompleted > 0) {
                cellStatus = 'good';
              }
            }

            let bgColor = isDarkMode ? '#334155' : '#f1f5f9';
            let dotColor = null;

            if (cellStatus === 'perfect') {
              bgColor = '#10b981'; // Green (Perfect Day)
              dotColor = '#fff';
            } else if (cellStatus === 'good') {
              bgColor = '#3b82f6'; // Blue (Good Day)
              dotColor = '#fff';
            }

            return (
              <div 
                key={day} 
                style={{ 
                  aspectRatio: '1', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: bgColor, 
                  color: dotColor || textColor,
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  border: isToday ? `2px solid ${isDarkMode ? '#fff' : '#0f172a'}` : 'none',
                  position: 'relative',
                  transition: 'background-color 0.3s ease'
                }}
                title={isToday || log ? `Water: ${cellWater}/8, Tasks: ${cellTasksCompleted}/${cellTotalTasks}` : 'No data'}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.9rem', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981' }}></div> Perfect
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#3b82f6' }}></div> Good
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: isDarkMode ? '#334155' : '#f1f5f9' }}></div> None
        </div>
      </div>
    </div>
  );
};

export default Calendar;