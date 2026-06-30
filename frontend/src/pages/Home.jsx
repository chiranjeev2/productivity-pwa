import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import './Home.css';

const Home = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { networkStatus, addToQueue, saveSnapshot, getSnapshot } = useSync();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const [time, setTime] = useState(new Date());
  const DAILY_GOAL = 8;
  const todayDateString = new Date().toISOString().split('T')[0];

  const [waterGlasses, setWaterGlasses] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  const isLive = networkStatus === 'live';

  const updateQueueCount = useCallback(() => {
    const queue = JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
    setQueueCount(queue.length);
  }, []);

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);
    updateQueueCount();

    const cachedTasks = getSnapshot('tasks') || [];
    const cachedWater = getSnapshot(`water_${todayDateString}`) || 0;
    
    let activeTasks = cachedTasks;
    let activeWater = cachedWater;

    const lastOpenedDate = localStorage.getItem('prodpro_last_opened_date');
    if (lastOpenedDate && lastOpenedDate !== todayDateString) {
      activeTasks = cachedTasks.map(task => ({ ...task, completed: false }));
      activeWater = 0;
      
      saveSnapshot('tasks', activeTasks);
      saveSnapshot(`water_${todayDateString}`, activeWater);

      activeTasks.forEach(task => {
        if (!isLive) {
          addToQueue('TOGGLE_TASK', `/tasks/${task._id}`, 'PUT');
        } else {
          const token = localStorage.getItem('token');
          fetch(`${API_URL}/tasks/${task._id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
        }
      });
    }
    localStorage.setItem('prodpro_last_opened_date', todayDateString);

    if (!isLive) {
      setTasks(activeTasks);
      setWaterGlasses(activeWater);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const taskRes = await fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (taskRes.ok) {
        let fetchedTasks = await taskRes.json();
        
        if (lastOpenedDate && lastOpenedDate !== todayDateString) {
          fetchedTasks = fetchedTasks.map(t => ({ ...t, completed: false }));
        }

        setTasks(fetchedTasks);
        saveSnapshot('tasks', fetchedTasks);
      }

      const calRes = await fetch(`${API_URL}/calendar`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (calRes.ok) {
        const logs = await calRes.json();
        const todayLog = logs.find(log => log.dateString === todayDateString);
        const waterCount = todayLog ? todayLog.waterIntake : 0;
        setWaterGlasses(waterCount);
        saveSnapshot(`water_${todayDateString}`, waterCount);
      }
    } catch (error) {
      console.error("Online dashboard fetch failed, running local caches.", error);
      setTasks(activeTasks);
      setWaterGlasses(activeWater);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, user, todayDateString, isLive, getSnapshot, saveSnapshot, addToQueue, updateQueueCount]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(true);

    const interval = setInterval(() => {
      if (isLive) fetchDashboardData(false);
      updateQueueCount();
    }, 5000);

    const handleFocusSync = () => { if (isLive) fetchDashboardData(false); updateQueueCount(); };
    window.addEventListener('focus', handleFocusSync);
    window.addEventListener('sync-complete', handleFocusSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusSync);
      window.removeEventListener('sync-complete', handleFocusSync);
    };
  }, [user, fetchDashboardData, isLive, updateQueueCount]);

  useEffect(() => {
    if (isLoading) return;

    const syncToCalendar = async () => {
      if (!isLive) {
        saveSnapshot(`water_${todayDateString}`, waterGlasses);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch(`${API_URL}/calendar/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            dateString: todayDateString,
            waterIntake: waterGlasses,
            tasksCompleted: tasks.filter(t => t.completed).length,
            totalTasks: tasks.length
          })
        });
      } catch (e) { console.error("Sync failure", e); }
    };
    syncToCalendar();
  }, [waterGlasses, tasks, isLoading, API_URL, todayDateString, isLive, saveSnapshot]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const tempId = Date.now().toString();
    const temporaryTask = { _id: tempId, text: newTaskText, completed: false };
    const updatedTasks = [temporaryTask, ...tasks];
    
    setTasks(updatedTasks);
    saveSnapshot('tasks', updatedTasks);
    const textToSubmit = newTaskText;
    setNewTaskText('');

    if (!isLive) {
      addToQueue('ADD_TASK', '/tasks', 'POST', { text: textToSubmit }, tempId);
      updateQueueCount();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: textToSubmit })
      });
      if (response.ok) {
        const serverTask = await response.json();
        setTasks(prev => {
          const fresh = prev.map(t => t._id === tempId ? serverTask : t);
          saveSnapshot('tasks', fresh);
          return fresh;
        });
      }
    } catch (error) {
      setTasks(prev => prev.filter(t => t._id !== tempId));
    }
  };

  const handleToggleTask = async (taskId) => {
    const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    saveSnapshot('tasks', updatedTasks);

    if (!isLive) {
      addToQueue('TOGGLE_TASK', `/tasks/${taskId}`, 'PUT');
      updateQueueCount();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/tasks/${taskId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      setTasks(tasks);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const backupTasks = [...tasks];
    const filteredTasks = tasks.filter(t => t._id !== taskId);
    setTasks(filteredTasks);
    saveSnapshot('tasks', filteredTasks);

    if (!isLive) {
      addToQueue('DELETE_TASK', `/tasks/${taskId}`, 'DELETE');
      updateQueueCount();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      setTasks(backupTasks);
    }
  };

  const handleWaterClick = (count) => {
    setWaterGlasses(count);
    saveSnapshot(`water_${todayDateString}`, count);
    if (!isLive) {
      addToQueue('SYNC_WATER', '/calendar/sync', 'POST', {
        dateString: todayDateString,
        waterIntake: count,
        tasksCompleted: tasks.filter(t => t.completed).length,
        totalTasks: tasks.length
      });
      updateQueueCount();
    }
  };

  const getVibeStatusCard = () => {
    switch (networkStatus) {
      case 'live':
        return {
          border: '1px solid #10b981',
          background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
          title: '✨ Cloud Synchronized',
          desc: 'Your metrics are perfectly secure and updated across all active endpoints.'
        };
      case 'reconnecting':
        return {
          border: '1px solid #f59e0b',
          background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
          title: `🔄 Replaying Outbox Queue (${queueCount})`,
          desc: 'Uploading staged actions sequentially back to the cluster server node...'
        };
      case 'offline':
        return {
          border: '1px solid #ef4444',
          background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
          title: queueCount > 0 ? `📦 Staging Changes (${queueCount} Queued)` : '💾 Operating Offline',
          desc: queueCount > 0 
            ? 'Modifications are running on localized state snapshots and will auto-sync on reconnect.'
            : 'Serving high-speed local data instances. Network polling is cleanly paused.'
        };
      default:
        return null;
    }
  };

  const vibe = getVibeStatusCard();
  const hour = time.getHours();
  let greeting = 'Good Night 🌙';
  if (hour >= 5 && hour < 12) greeting = 'Good Morning ☀️';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌇';

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>{greeting}</h1>
        <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0, fontWeight: '500' }}>
          {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {vibe && (
        <div style={{ border: vibe.border, background: vibe.background, padding: '1rem', borderRadius: '12px', marginBottom: '2rem', transition: 'all 0.3s ease' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700' }}>{vibe.title}</h4>
          <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.85, lineHeight: '1.4' }}>{vibe.desc}</p>
        </div>
      )}

      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}`, marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>💧 Daily Hydration</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3b82f6' }}>{waterGlasses} / {DAILY_GOAL}</span>
        </h3>
        <div className="water-grid">
          {[...Array(DAILY_GOAL)].map((_, index) => (
            <button
              key={index}
              onClick={() => handleWaterClick(index + 1)}
              style={{
                borderRadius: '8px', border: 'none',
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

      <div style={{ background: cardBg, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${borderColor}` }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>✅ Today's Focus</h3>
        <form onSubmit={handleAddTask} className="task-form">
          <input 
            type="text"
            className="task-input"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${borderColor}`, color: textColor }}
          />
          <button type="submit" className="task-submit-btn">Add</button>
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
                  <span style={{ textDecoration: task.completed ? 'line-through' : 'none', fontWeight: task.completed ? 'normal' : '500' }}>
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