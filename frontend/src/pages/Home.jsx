import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Home.css';

const Home = () => {
  const { isDarkMode } = useTheme();
  
  const [time, setTime] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const DAILY_GOAL = 8;

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review DSA Graphs & Trees', completed: false },
    { id: 2, text: 'Complete Sigma MERN module', completed: true }
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  let greeting = 'Good Night 🌙';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning ☀️';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌇';

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto' }}>
      
      {/* DYNAMIC HEADER */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
          {greeting}
        </h1>
        <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0, fontWeight: '500' }}>
          {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* HYDRATION WIDGET */}
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
        
        {/* Added className="water-grid" here */}
        <div className="water-grid" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {[...Array(DAILY_GOAL)].map((_, index) => (
            <button
              key={index}
              onClick={() => setWaterGlasses(index + 1)}
              className="water-cube-btn" // Added class here
              style={{
                flex: 1,
                aspectRatio: '1',
                borderRadius: '8px',
                border: 'none',
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

      {/* TODAY'S TASKS UI */}
      <div style={{ 
        background: cardBg, 
        padding: '1.5rem', 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>✅ Today's Focus</h3>
        
        <input 
          type="text"
          className="task-input"
          placeholder="Add a new task... (Press Enter)"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          style={{
            background: isDarkMode ? '#0f172a' : '#f8fafc',
            border: `1px solid ${borderColor}`,
            color: textColor
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="task-item"
              style={{
                background: isDarkMode ? '#334155' : '#f1f5f9',
                opacity: task.completed ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  readOnly
                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                />
                <span style={{ 
                  textDecoration: task.completed ? 'line-through' : 'none',
                  fontWeight: task.completed ? 'normal' : '500'
                }}>
                  {task.text}
                </span>
              </div>
              <button className="delete-btn" title="Delete Task">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;