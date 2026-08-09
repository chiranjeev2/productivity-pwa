import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';

const Calendar = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { networkStatus, getSnapshot, saveSnapshot } = useSync();
  
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
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

  // 🔴 LOOP-FREE ISOLATION: Fetches only on mount or user state change
  useEffect(() => {
    if (user) fetchCalendarData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 🔴 BACKGROUND POLL: Safely polls every 5s without causing render crashes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (networkStatus === 'live') fetchCalendarData(false);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, networkStatus]);

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  // Generate Current Month Grid
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
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
            const isToday = dateString === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            // Edge-Computed Color Logic
            let bgColor = isDarkMode ? '#334155' : '#f1f5f9';
            let dotColor = null;

            if (log) {
              const waterMet = log.waterIntake >= 8;
              const tasksMet = log.totalTasks > 0 && log.tasksCompleted === log.totalTasks;
              
              if (waterMet && tasksMet) {
                bgColor = '#10b981'; // Green (Perfect Day)
                dotColor = '#fff';
              } else if (log.waterIntake > 0 || log.tasksCompleted > 0) {
                bgColor = '#f59e0b'; // Yellow (Partial Day)
                dotColor = '#fff';
              }
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
                  position: 'relative'
                }}
                title={log ? `Water: ${log.waterIntake}/8, Tasks: ${log.tasksCompleted}/${log.totalTasks}` : 'No data'}
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
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#f59e0b' }}></div> Partial
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: isDarkMode ? '#334155' : '#f1f5f9' }}></div> None
        </div>
      </div>
    </div>
  );
};

export default Calendar;