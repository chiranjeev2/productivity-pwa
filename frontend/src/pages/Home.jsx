import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const [time, setTime] = useState(new Date());
  const DAILY_GOAL = 8;
  
  const todayObj = new Date();
  const year = todayObj.getFullYear();
  const month = String(todayObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayObj.getDate()).padStart(2, '0');
  const todayDateString = `${year}-${month}-${day}`;

  const [waterGlasses, setWaterGlasses] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from DB (Both Tasks AND Today's real Water intake)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. Fetch tasks
        const taskRes = await fetch(`${API_URL}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let fetchedTasks = [];
        if (taskRes.ok) {
          fetchedTasks = await taskRes.json();
          setTasks(fetchedTasks);
        }

        // 2. Fetch today's log to grab cross-device water intake
        const calRes = await fetch(`${API_URL}/calendar`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (calRes.ok) {
          const logs = await calRes.json();
          const todayLog = logs.find(log => log.dateString === todayDateString);
          if (todayLog) {
            setWaterGlasses(todayLog.waterIntake);
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchInitialData();
  }, [API_URL, user, todayDateString]);

  // Background calendar syncing logic
  useEffect(() => {
    if (isLoading) return;

    const syncToCalendar = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const tasksCompleted = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;

        await fetch(`${API_URL}/calendar/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            dateString: todayDateString,
            waterIntake: waterGlasses,
            tasksCompleted,
            totalTasks
          })
        });
      } catch (error) {
        console.error("Calendar sync failed:", error);
      }
    };

    syncToCalendar();
  }, [waterGlasses, tasks, isLoading, API_URL, todayDateString]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // OPTIMISTIC TASK MANAGEMENT (Instant UI Updates)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const tempId = Date.now().toString();
    const temporaryTask = { _id: tempId, text: newTaskText, completed: false };
    
    setTasks([temporaryTask, ...tasks]);
    const textToSubmit = newTaskText;
    setNewTaskText('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSubmit })
      });

      if (response.ok) {
        const serverTask = await response.json();
        setTasks(prev => prev.map(t => t._id === tempId ? serverTask : t));
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      setTasks(prev => prev.filter(t => t._id !== tempId));
    }
  };

  const handleToggleTask = async (taskId) => {
    setTasks(tasks.map(t => t._id === taskId ? { ...t, completed: !t.completed } : t));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      setTasks(tasks.map(t => t._id === taskId ? { ...t, completed: !t.completed } : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    const backupTasks = [...tasks];
    setTasks(tasks.filter(t => t._id !== taskId));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      setTasks(backupTasks);
    }
  };

  const hour = time.getHours();
  let greeting = 'Good Night 🌙';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning ☀️';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌇';

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    /* 🔴 FIXED: Added paddingBottom: '100px' to allow scrolling room past the fixed mobile navigation bar */
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>{greeting}</h1>
        <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0, fontWeight: '500' }}>
          {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* HYDRATION WIDGET */}
      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}`, marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>💧 Daily Hydration</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>{waterGlasses} / {DAILY_GOAL}</span>
        </h3>
        
        {/* 🔴 FIXED: Stripped inline flex declarations so it relies cleanly on the responsive grid styles from Home.css */}
        <div className="water-grid">
          {[...Array(DAILY_GOAL)].map((_, index) => (
            <button
              key={index}
              onClick={() => setWaterGlasses(index + 1)}
              style={{
                aspectRatio: '1', borderRadius: '8px', border: 'none',
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
      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>✅ Today's Focus</h3>
        
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <input 
            type="text"
            className="task-input"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${borderColor}`, color: textColor, marginBottom: 0, flex: 1 }}
          />
          <button type="submit" style={{ padding: '0 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            Add
          </button>
        </form>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Loading tasks...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tasks.length === 0 && <p style={{ fontStyle: 'italic', color: isDarkMode ? '#94a3b8' : '#64748b' }}>No tasks for today. Get some rest!</p>}
            {tasks.map(task => (
              <div key={task._id} className="task-item" style={{ background: isDarkMode ? '#334155' : '#f1f5f9', opacity: task.completed ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} onClick={() => handleToggleTask(task._id)}>
                  <input type="checkbox" checked={task.completed} readOnly style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                  <span style={{ textDecoration: task.completed ? 'line-through' : 'none', fontWeight: task.completed ? 'normal' : '500', cursor: 'pointer' }}>
                    {task.text}
                  </span>
                </div>
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;