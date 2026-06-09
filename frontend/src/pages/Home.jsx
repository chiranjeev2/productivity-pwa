import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Home = () => {
  const { isDarkMode } = useTheme();
  
  // State for the Clock and Water Tracker
  const [time, setTime] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const DAILY_GOAL = 8;

  // 1. Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Dynamic Greeting Logic
  const hour = time.getHours();
  let greeting = 'Good Night 🌙';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning ☀️';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌇';

  // 3. Theme Colors
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto' }}>
      
      {/* 🔴 DYNAMIC HEADER */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
          {greeting}
        </h1>
        <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0, fontWeight: '500' }}>
          {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* 🔴 HYDRATION WIDGET */}
      <div style={{ 
        background: cardBg, 
        padding: '1.5rem', 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>💧 Daily Hydration</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {waterGlasses} / {DAILY_GOAL}
          </span>
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {[...Array(DAILY_GOAL)].map((_, index) => (
            <button
              key={index}
              onClick={() => setWaterGlasses(index + 1)}
              style={{
                flex: 1,
                aspectRatio: '1',
                borderRadius: '8px',
                border: 'none',
                // Smooth blue color for filled glasses, subtle gray for empty
                background: index < waterGlasses ? '#3b82f6' : (isDarkMode ? '#334155' : '#f1f5f9'),
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: index < waterGlasses ? 'scale(1.05)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}
            >
              {index < waterGlasses ? '🧊' : ''}
            </button>
          ))}
        </div>
        <p style={{ textAlign: 'center', margin: '1rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
          Tap a glass to log your intake
        </p>
      </div>

      {/* 🔴 TODAY'S TASKS (Container for next step) */}
      <div style={{ 
        background: cardBg, 
        padding: '1.5rem', 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>✅ Today's Focus</h3>
        <p style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontStyle: 'italic' }}>
          Your task list and hover effects will be connected here shortly.
        </p>
      </div>

    </div>
  );
};

export default Home;