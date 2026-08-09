import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // ⏰ TRUE LOCAL MIDNIGHT GENERATOR: Guarantees 00:00 rollover in your exact timezone
  const getLocalDateString = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [waterGlasses, setWaterGlasses] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  const isLive = networkStatus === 'live';
  
  // 🛡️ THE INTERACTION LOCK: Prevents server echo from overwriting your clicks
  const lastActionTime = useRef(0);
  const blockIncomingSync = () => { lastActionTime.current = Date.now(); };
  const canAcceptIncomingSync = () => (Date.now() - lastActionTime.current) > 10000; // 10 second lock

  const updateQueueCount = useCallback(() => {
    const queue = JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
    setQueueCount(queue.length);
  }, []);

  // 📊 CENTRALIZED CALENDAR PUSHER: Guarantees Calendar stays synced with every action
  const pushCalendarSummary = async (currentTasks, currentWater) => {
    const todayDateString = getLocalDateString();
    const payload = {
      dateString: todayDateString,
      waterIntake: currentWater,
      tasksCompleted: currentTasks.filter(t => t.completed).length,
      totalTasks: currentTasks.length
    };
    
    if (!isLive) {
      addToQueue('SYNC_WATER', '/calendar/sync', 'POST', payload);
      updateQueueCount();
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch(`${API_URL}/calendar/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      addToQueue('SYNC_WATER', '/calendar/sync', 'POST', payload);
      updateQueueCount();
    }
  };

  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    if (!user) return;
    updateQueueCount();

    const todayDateString = getLocalDateString();

    // PHASE 1: Instant snapshot load only on first mount (Stops flickering)
    if (isInitialLoad) {
      const cachedTasks = getSnapshot('tasks') || [];
      const cachedWater = getSnapshot(`water_${todayDateString}`) || 0;
      setTasks(cachedTasks);
      setWaterGlasses(cachedWater);
      if (cachedTasks.length === 0 && cachedWater === 0) setIsLoading(true);
    }

    // PHASE 2: True Daily Reset Engine
    const lastOpenedDate = localStorage.getItem('prodpro_last_opened_date');
    if (lastOpenedDate && lastOpenedDate !== todayDateString) {
      blockIncomingSync(); // Lock out the server during reset
      
      const currentTasks = getSnapshot('tasks') || tasks;
      const tasksToReset = currentTasks.filter(t => t.completed);
      
      const resetTasks = currentTasks.map(t => ({ ...t, completed: false }));
      
      setTasks(resetTasks);
      setWaterGlasses(0);
      saveSnapshot('tasks', resetTasks);
      saveSnapshot(`water_${todayDateString}`, 0);
      localStorage.setItem('prodpro_last_opened_date', todayDateString);

      // Package resets into the Outbox Queue for safe, guaranteed execution
      tasksToReset.forEach(task => {
        addToQueue('TOGGLE_TASK', `/tasks/${task._id}`, 'PUT');
      });
      
      await pushCalendarSummary(resetTasks, 0);
      
      // Kickstart the queue immediately if we are online
      if (navigator.onLine) window.dispatchEvent(new Event('online'));
      
      setIsLoading(false);
      return; // Exit fetch loop to let queue process
    }

    if (!lastOpenedDate) {
      localStorage.setItem('prodpro_last_opened_date', todayDateString);
    }

    // PHASE 3: Background Validation (Only runs if Interaction Lock is open)
    if (!isLive || !canAcceptIncomingSync()) {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [taskRes, calRes] = await Promise.all([
        fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/calendar`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Double-check lock in case user clicked while fetch was in transit
      if (!canAcceptIncomingSync()) return;

      if (taskRes.ok) {
        const fetchedTasks = await taskRes.json();
        setTasks(fetchedTasks);
        saveSnapshot('tasks', fetchedTasks);
      }

      if (calRes.ok) {
        const logs = await calRes.json();
        const todayLog = logs.find(log => log.dateString === todayDateString);
        const waterCount = todayLog ? todayLog.waterIntake : 0;
        setWaterGlasses(waterCount);
        saveSnapshot(`water_${todayDateString}`, waterCount);
      }
    } catch (error) {
      console.error("Background data re-validation failed quietly");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, user, isLive, getSnapshot, saveSnapshot, addToQueue, updateQueueCount, getLocalDateString, tasks]);

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
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    blockIncomingSync(); // Engage 10-second lock

    const tempId = Date.now().toString();
    const temporaryTask = { _id: tempId, text: newTaskText, completed: false };
    const updatedTasks = [temporaryTask, ...tasks];

    setTasks(updatedTasks);
    saveSnapshot('tasks', updatedTasks);
    pushCalendarSummary(updatedTasks, waterGlasses); // Update calendar stats
    
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
      addToQueue('ADD_TASK', '/tasks', 'POST', { text: textToSubmit }, tempId);
      updateQueueCount();
    }
  };

  const handleToggleTask = async (taskId) => {
    blockIncomingSync(); // Engage 10-second lock

    const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    saveSnapshot('tasks', updatedTasks);
    pushCalendarSummary(updatedTasks, waterGlasses); // Update calendar stats

    if (!isLive) {
      addToQueue('TOGGLE_TASK', `/tasks/${taskId}`, 'PUT');
      updateQueueCount();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/tasks/${taskId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      addToQueue('TOGGLE_TASK', `/tasks/${taskId}`, 'PUT');
      updateQueueCount();
    }
  };

  const handleDeleteTask = async (taskId) => {
    blockIncomingSync(); // Engage 10-second lock

    const filteredTasks = tasks.filter(t => t._id !== taskId);
    setTasks(filteredTasks);
    saveSnapshot('tasks', filteredTasks);
    pushCalendarSummary(filteredTasks, waterGlasses); // Update calendar stats

    if (!isLive) {
      addToQueue('DELETE_TASK', `/tasks/${taskId}`, 'DELETE');
      updateQueueCount();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      addToQueue('DELETE_TASK', `/tasks/${taskId}`, 'DELETE');
      updateQueueCount();
    }
  };

  const handleWaterClick = (count) => {
    blockIncomingSync(); // Engage 10-second lock

    setWaterGlasses(count);
    saveSnapshot(`water_${getLocalDateString()}`, count);
    pushCalendarSummary(tasks, count); // Updates Calendar DB instantly
    updateQueueCount();
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