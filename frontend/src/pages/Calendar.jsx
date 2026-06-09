import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Calendar.css';

const Calendar = () => {
  const { isDarkMode } = useTheme();

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Temporary UI State: Mocking some data (Matches June 2026 for visual testing)
  const [analyticsData] = useState({
    '2026-6-8': { water: 8, tasksDone: true, loggedIn: true },
    '2026-6-9': { water: 5, tasksDone: false, loggedIn: true },
    '2026-6-10': { water: 8, tasksDone: true, loggedIn: true }, 
  });

  // Calendar Math calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = Jan, 5 = Jun)
  
  // Get the number of days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get the day of the week the month starts on (0 = Sunday, 1 = Monday...)
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Navigation Handlers
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // Theme Colors
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedText = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const cellBg = isDarkMode ? '#334155' : '#f1f5f9';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

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
        
        {/* Dynamic Month Header & Navigation */}
        <div className="calendar-header">
          <button className="nav-btn" onClick={prevMonth} style={{ color: textColor }}>
            ◀
          </button>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <button className="nav-btn" onClick={nextMonth} style={{ color: textColor }}>
            ▶
          </button>
        </div>

        <div className="calendar-grid">
          {/* Day Headers (Sun, Mon, Tue...) */}
          {weekDays.map(day => (
            <div key={day} className="calendar-day-header" style={{ color: mutedText }}>
              {day}
            </div>
          ))}

          {/* Blank cells for padding the start of the month */}
          {[...Array(firstDayOfMonth)].map((_, index) => (
            <div key={`blank-${index}`} className="calendar-cell" style={{ visibility: 'hidden' }}></div>
          ))}

          {/* Actual Days */}
          {[...Array(daysInMonth)].map((_, index) => {
            const dateNumber = index + 1;
            // Create a key like "2026-6-10" to match our fake analytics data
            const dateString = `${year}-${month + 1}-${dateNumber}`;
            const dayData = analyticsData[dateString];
            
            // Check if this box is EXACTLY today's real date
            const today = new Date();
            const isToday = dateNumber === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            
            return (
              <div 
                key={dateNumber} 
                className="calendar-cell" 
                style={{ 
                  background: isToday ? (isDarkMode ? '#1e3a8a' : '#dbeafe') : cellBg,
                  border: isToday ? '2px solid #3b82f6' : '2px solid transparent'
                }}
              >
                <span className="date-number" style={{ color: isToday ? '#3b82f6' : textColor }}>
                  {dateNumber}
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
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.85rem', color: mutedText }}>
        <span>🟢 Login</span>
        <span>💧 Hydration</span>
        <span>✅ All Tasks</span>
      </div>

    </div>
  );
};

export default Calendar;