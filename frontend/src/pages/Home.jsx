import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Base API URL
  const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

  // -----------------------------------------
  // CLOCK & WATER STATE (Unchanged)
  // -----------------------------------------
  const [time, setTime] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const DAILY_GOAL = 8;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  let greeting = 'Good Night 🌙';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning ☀️';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌇';

  // -----------------------------------------
  // DATABASE TASK STATE
  // -----------------------------------------
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. FETCH TASKS ON LOAD
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchTasks();
  }, [API_URL, user]);

  // 2. CREATE NEW TASK
  const handleAddTask = async (e) => {
    if (e.key !== 'Enter' || !newTaskText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newTaskText })
      });

      if (response.ok) {
        const addedTask = await response.json();
        setTasks([addedTask, ...tasks]); // Add to top of list
        setNewTaskText(''); // Clear input
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  // 3. TOGGLE TASK COMPLETION
  const handleToggleTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t._id === taskId ? updatedTask : t));
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  // 4. DELETE TASK
  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Theme Colors
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto' }}>
      
      {/* HEADER */}
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
        background: cardBg, padding: '1.5rem', borderRadius: '16px', 
        border: `1px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>💧 Daily Hydration</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>{waterGlasses} / {DAILY_GOAL}</span>
        </h3>
        
        <div className="water-grid" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {[...Array(DAILY_GOAL)].map((_, index) => (
            <button
              key={index}
              onClick={() => setWaterGlasses(index + 1)}
              className="water-cube-btn"
              style={{
                flex: 1, aspectRatio: '1', borderRadius: '8px', border: 'none',
                background: index < waterGlasses ? '#3b82f6' : (isDarkMode ? '#334155' : '#f1f5f9'),
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: index < waterGlasses ? 'scale(1.05)' : 'scale(1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
              }}
            >
              {index < waterGlasses ? '🧊' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* TODAY'S TASKS UI */}
      <div style={{ 
        background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}`,
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>✅ Today's Focus</h3>
        
        <input 
          type="text"
          className="task-input"
          placeholder="Add a new task... (Press Enter)"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleAddTask}
          style={{
            background: isDarkMode ? '#0f172a' : '#f8fafc',
            border: `1px solid ${borderColor}`,
            color: textColor
          }}
        />

        {isLoading ? (
          <p style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Loading tasks...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tasks.length === 0 && <p style={{ fontStyle: 'italic', color: isDarkMode ? '#94a3b8' : '#64748b' }}>No tasks for today. Get some rest!</p>}
            
            {tasks.map(task => (
              <div 
                key={task._id} 
                className="task-item"
                style={{
                  background: isDarkMode ? '#334155' : '#f1f5f9',
                  opacity: task.completed ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} onClick={() => handleToggleTask(task._id)}>
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    readOnly
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                  <span style={{ 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontWeight: task.completed ? 'normal' : '500',
                    cursor: 'pointer'
                  }}>
                    {task.text}
                  </span>
                </div>
                <button 
                  className="delete-btn" 
                  title="Delete Task"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents checking the box when clicking delete
                    handleDeleteTask(task._id);
                  }}
                >🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;