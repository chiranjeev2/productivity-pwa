import React, { useState, useEffect } from 'react';
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

  const fetchCalendarData = async () => {
    // 1. Instantly load from snapshot cache
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
      console.error("Calendar fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔴 FIXED: Severed the Infinite Loop by isolating the dependency arrays
  useEffect(() => {
    if (user) fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  // Sort logs by newest date first
  const sortedLogs = [...logs].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>📅 Calendar History</h1>
        <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Review your daily progress.</p>
      </div>

      {isLoading && logs.length === 0 ? (
        <p style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Loading history...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedLogs.length === 0 && (
            <p style={{ fontStyle: 'italic', color: isDarkMode ? '#94a3b8' : '#64748b', textAlign: 'center' }}>No history logged yet.</p>
          )}
          {sortedLogs.map((log) => {
            const dateObj = new Date(log.dateString);
            const displayDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
            
            return (
              <div key={log.dateString} style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{displayDate}</h4>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      💧 {log.waterIntake} / 8 Glasses
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ✅ {log.tasksCompleted} / {log.totalTasks} Tasks
                    </span>
                  </div>
                </div>

                <div style={{ background: log.waterIntake >= 8 ? '#10b981' : (isDarkMode ? '#334155' : '#e2e8f0'), color: log.waterIntake >= 8 ? '#fff' : textColor, padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {log.waterIntake >= 8 ? 'Goal Met' : 'Missed'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default Calendar;