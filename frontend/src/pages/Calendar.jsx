import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Calendar = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar setup for the current month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Figure out how many days are in this month, and what day of the week the 1st is
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday...

  useEffect(() => {
    const fetchCalendarLogs = async () => {
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
    };
    if (user) fetchCalendarLogs();
  }, [API_URL, user]);

  // Helper function to find a log for a specific day
  const getLogForDay = (day) => {
    // Format the day as YYYY-MM-DD to match the database string
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    return logs.find(log => log.dateString === dateString);
  };

  // Determine the color of the square based on the database status
  const getSquareColor = (status) => {
    switch (status) {
      case 'perfect': return '#10b981'; // Green
      case 'good': return '#3b82f6';    // Blue
      case 'missed': return '#ef4444';  // Red
      default: return isDarkMode ? '#334155' : '#e2e8f0'; // Empty/Gray
    }
  };

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedText = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>📅 Calendar</h1>
        <p style={{ fontSize: '1.1rem', color: mutedText, margin: 0, fontWeight: '500' }}>
          {monthNames[currentMonth]} {currentYear}
        </p>
      </div>

      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        
        {/* Days of the week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold', color: mutedText }}>
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>

        {/* The actual calendar grid */}
        {isLoading ? (
          <p style={{ textAlign: 'center', color: mutedText, padding: '2rem 0' }}>Loading your history...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            
            {/* Render empty squares for days before the 1st of the month */}
            {[...Array(firstDayOfMonth)].map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: '8px', background: 'transparent' }}></div>
            ))}

            {/* Render the actual days of the month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const log = getLogForDay(day);
              const isToday = day === today.getDate();
              
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
                    border: isToday ? `2px solid ${isDarkMode ? '#f8fafc' : '#0f172a'}` : 'none',
                    opacity: day > today.getDate() ? 0.3 : 1 // Fade out future days
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

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981' }}></div><span style={{ fontSize: '0.9rem', color: mutedText }}>Perfect</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#3b82f6' }}></div><span style={{ fontSize: '0.9rem', color: mutedText }}>Good</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ef4444' }}></div><span style={{ fontSize: '0.9rem', color: mutedText }}>Missed</span></div>
      </div>
    </div>
  );
};

export default Calendar;