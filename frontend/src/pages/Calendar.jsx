import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Calendar.css';

const Calendar = () => {
  const { isDarkMode } = useTheme();

  // Temporary UI State: Mocking some data for the past few days
  // Keys represent the date number (e.g., the 8th, 9th, 10th of the month)
  const [analyticsData] = useState({
    8: { water: 8, tasksDone: true, loggedIn: true },
    9: { water: 5, tasksDone: false, loggedIn: true },
    10: { water: 8, tasksDone: true, loggedIn: true }, // Today
  });

  // Theme Colors
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedText = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const cellBg = isDarkMode ? '#334155' : '#f1f5f9';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  // Generate an array of 30 days for a standard month view
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
          🗓️ Analytics Hub
        </h1>
        <p style={{ fontSize: '1.1rem', color: mutedText, margin: 0, fontWeight: '500' }}>
          Review your consistency and habits.
        </p>
      </div>

      {/* CALENDAR CARD */}
      <div style={{ 
        background: cardBg, 
        padding: '1.5rem', 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', textAlign: 'center' }}>
          June 2026
        </h3>

        <div className="calendar-grid">
          {/* Day Headers (Sun, Mon, Tue...) */}
          {weekDays.map(day => (
            <div key={day} className="calendar-day-header" style={{ color: mutedText }}>
              {day}
            </div>
          ))}

          {/* Blank cells for padding the start of the month (Assume month starts on a Monday) */}
          <div className="calendar-cell" style={{ visibility: 'hidden' }}></div>

          {/* Actual Days */}
          {daysInMonth.map(date => {
            const dayData = analyticsData[date];
            const isToday = date === 10; // Hardcoded for mockup purposes
            
            return (
              <div 
                key={date} 
                className="calendar-cell" 
                style={{ 
                  background: isToday ? (isDarkMode ? '#1e3a8a' : '#dbeafe') : cellBg,
                  border: isToday ? '2px solid #3b82f6' : '2px solid transparent'
                }}
              >
                <span className="date-number" style={{ color: isToday ? '#3b82f6' : textColor }}>
                  {date}
                </span>
                
                {/* Badges for Habits */}
                {dayData && (
                  <div className="badge-container">
                    {dayData.loggedIn && <span className="activity-badge" title="Logged In">🟢</span>}
                    {dayData.water >= 8 && <span className="activity-badge" title="Water Goal Met">💧</span>}
                    {dayData.tasksDone && <span className="activity-badge" title="Tasks Finished">✅</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LEGEND */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.9rem', color: mutedText }}>
        <span>🟢 Login</span>
        <span>💧 Hydration</span>
        <span>✅ All Tasks</span>
      </div>

    </div>
  );
};

export default Calendar;