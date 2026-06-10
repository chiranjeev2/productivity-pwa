import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Calendar = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); 
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); 

  // Memoized fetch function so it can be safely used across intervals and focus listeners
  const fetchCalendarLogs = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/calendar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, user]);

  // 🔴 LIVE SYNC ENGINE: Controls Background Polling & Focus Re-validation
  useEffect(() => {
    if (!user) return;

    // Initial load
    fetchCalendarLogs(true);

    // 1. Smart Polling: Fetch background changes every 5 seconds
    const interval = setInterval(() => {
      fetchCalendarLogs(false); // false means don't show flickering loading screens
    }, 5000);

    // 2. Focus Triggers: Sync instantly when user unlocks phone or switches tabs
    const handleFocus = () => fetchCalendarLogs(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, fetchCalendarLogs]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getLogForDay = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return logs.find(log => log.dateString === dateString);
  };

  const getSquareColor = (status) => {
    switch (status) {
      case 'perfect': return '#10b981'; 
      case 'good': return '#3b82f6';    
      case 'missed': return '#ef4444';  
      default: return isDarkMode ? '#334155' : '#e2e8f0'; 
    }
  };

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedText = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>📊 Consistency Tracker</h1>
        <p style={{ fontSize: '1.1rem', color: mutedText, margin: 0, fontWeight: '500' }}>
          Build the chain, day by day.
        </p>
      </div>

      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', color: textColor, fontSize: '1.5rem', cursor: 'pointer', padding: '0 10px' }}>
            &#8592;
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', color: textColor, fontSize: '1.5rem', cursor: 'pointer', padding: '0 10px' }}>
            &#8594;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold', color: mutedText }}>
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: mutedText, padding: '2rem 0' }}>Loading your history...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            
            {[...Array(firstDayOfMonth)].map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: '8px', background: 'transparent' }}></div>
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const log = getLogForDay(day);
              const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              
              return (
                <div 
                  key={day} 
                  style={{ 
                    aspectRatio: '1', 
                    borderRadius: '8px', 
                    background: getSquareColor(log?.status),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: log?.status && log.status !== 'empty' ? '#fff' : mutedText,
                    border: isToday ? '2px solid #3b82f6' : 'none',
                    boxShadow: isToday ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none'
                  }}
                  title={log ? `Water: ${log.waterIntake} | Tasks: ${log.tasksCompleted}` : 'No data'}
                >
                  {day}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981' }}></div><span style={{ fontSize: '0.9rem', color: mutedText }}>Perfect</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#3b82f6' }}></div><span style={{ fontSize: '0.9rem', color: mutedText }}>Good</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ef4444' }}></div><span style={{ fontSize: '0.9rem', color: mutedText }}>Missed</span></div>
      </div>
    </div>
  );
};

export default Calendar;