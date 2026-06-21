import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import './Goals.css';

const Goals = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isOffline, addToQueue, saveSnapshot, getSnapshot } = useSync();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('short-term');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);

  // 🔴 FIXED: Cache-First Hydration Strategy
  const fetchGoals = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);

    // 1. Instantly populate UI from local hardware snapshots so it never renders blank
    const cachedGoals = getSnapshot('goals');
    if (cachedGoals && Array.isArray(cachedGoals)) {
      setGoals(cachedGoals);
    }

    // 2. If completely offline, halt here and don't fire network errors
    if (isOffline) {
      setIsLoading(false);
      return;
    }

    // 3. If online, quietly pull fresh records down from MongoDB cluster
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setGoals(data);
          saveSnapshot('goals', data); // Refresh cache snapshot baseline
        }
      }
    } catch (error) {
      console.error("Failed to fetch goals online:", error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, user, isOffline, getSnapshot, saveSnapshot]);

  useEffect(() => {
    if (!user) return;
    fetchGoals(true);

    const interval = setInterval(() => {
      if (!isOffline) fetchGoals(false);
    }, 5000);

    const handleFocusSync = () => { if (!isOffline) fetchGoals(false); };
    window.addEventListener('focus', handleFocusSync);
    window.addEventListener('sync-complete', handleFocusSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusSync);
      window.removeEventListener('sync-complete', handleFocusSync);
    };
  }, [user, fetchGoals, isOffline]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tempId = Date.now().toString();
    const assignedColor = newType === 'short-term' ? '#3b82f6' : '#10b981';
    
    const temporaryGoal = {
      _id: tempId,
      title: newTitle,
      type: newType,
      progress: 0,
      color: assignedColor
    };

    const updatedGoals = [temporaryGoal, ...goals];
    setGoals(updatedGoals);
    saveSnapshot('goals', updatedGoals);

    const titleToSubmit = newTitle;
    const typeToSubmit = newType;
    setNewTitle('');

    if (isOffline) {
      addToQueue('ADD_GOAL', '/goals', 'POST', { title: titleToSubmit, type: typeToSubmit, progress: 0, color: assignedColor });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: titleToSubmit, type: typeToSubmit, progress: 0, color: assignedColor })
      });

      if (response.ok) {
        const addedGoal = await response.json();
        setGoals(prev => {
          const fresh = prev.map(g => g._id === tempId ? addedGoal : g);
          saveSnapshot('goals', fresh);
          return fresh;
        });
      }
    } catch (error) {
      setGoals(prev => prev.filter(g => g._id !== tempId));
    }
  };

  const handleDeleteGoal = async (goalId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this goal?")) return;

    const backupGoals = [...goals];
    const filteredGoals = goals.filter(g => g._id !== goalId);
    setGoals(filteredGoals);
    saveSnapshot('goals', filteredGoals);

    if (isOffline) {
      addToQueue('DELETE_GOAL', `/goals/${goalId}`, 'DELETE');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      setGoals(backupGoals);
    }
  };

  const openProgressModal = (goal) => {
    setActiveGoal(goal);
    setSliderValue(goal.progress);
    setIsModalOpen(true);
  };

  const saveProgressUpdate = async () => {
    if (!activeGoal) return;
    
    const previousGoals = [...goals];
    const updatedGoals = goals.map(g => g._id === activeGoal._id ? { ...g, progress: parseInt(sliderValue) } : g);
    setGoals(updatedGoals);
    saveSnapshot('goals', updatedGoals);
    setIsModalOpen(false);

    if (isOffline) {
      addToQueue('UPDATE_GOAL', `/goals/${activeGoal._id}`, 'PUT', { progress: parseInt(sliderValue) });
      setActiveGoal(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/goals/${activeGoal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ progress: parseInt(sliderValue) })
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(prev => {
          const fresh = prev.map(g => g._id === updatedGoal._id ? updatedGoal : g);
          saveSnapshot('goals', fresh);
          return fresh;
        });
      }
    } catch (error) {
      setGoals(previousGoals);
    } finally {
      setActiveGoal(null);
    }
  };

  // 🔴 FIXED: Protected filters using strict Array validation to eliminate crash loops
  const shortTermGoals = Array.isArray(goals) ? goals.filter(g => g.type === 'short-term') : [];
  const longTermGoals = Array.isArray(goals) ? goals.filter(g => g.type === 'long-term') : [];

  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedText = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const trackBg = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', position: 'relative' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>🎯 Vision Board</h1>
        <p style={{ fontSize: '1.1rem', color: mutedText, margin: 0, fontWeight: '500' }}>Track your strategic milestones.</p>
      </div>

      <form onSubmit={handleAddGoal} style={{ marginBottom: '2rem', background: cardBg, padding: '1rem', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
        <div className="goal-form-container">
          <input 
            type="text" 
            placeholder="e.g., Complete MERN Module" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: isDarkMode ? '#0f172a' : '#f8fafc', color: textColor, outline: 'none' }}
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: isDarkMode ? '#0f172a' : '#f8fafc', color: textColor, outline: 'none' }}>
            <option value="short-term">Short Term</option>
            <option value="long-term">Long Term</option>
          </select>
          <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            Add Goal
          </button>
        </div>
      </form>

      {isLoading && goals.length === 0 ? (
        <p style={{ textAlign: 'center', color: mutedText }}>Loading goals...</p>
      ) : (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>🚀 Short-Term</h3>
            {shortTermGoals.length === 0 && <p style={{ color: mutedText, fontStyle: 'italic' }}>No short-term goals yet.</p>}
            {shortTermGoals.map(goal => (
              <div key={goal._id} onClick={() => openProgressModal(goal)} style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '1rem', borderRadius: '12px', marginBottom: '1rem', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', lineHeight: '1.2' }}>{goal.title}</span>
                    <span style={{ fontWeight: 'bold', color: goal.color, fontSize: '0.9rem' }}>{goal.progress}% Completed</span>
                  </div>
                  <button className="goal-delete-btn" onClick={(e) => handleDeleteGoal(goal._id, e)}>🗑️</button>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: trackBg, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${goal.progress}%`, background: goal.color, transition: 'width 0.5s ease-out' }}></div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>🏔️ Long-Term</h3>
            {longTermGoals.length === 0 && <p style={{ color: mutedText, fontStyle: 'italic' }}>No long-term goals yet.</p>}
            {longTermGoals.map(goal => (
              <div key={goal._id} onClick={() => openProgressModal(goal)} style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '1rem', borderRadius: '12px', marginBottom: '1rem', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', lineHeight: '1.2' }}>{goal.title}</span>
                    <span style={{ fontWeight: 'bold', color: goal.color, fontSize: '0.9rem' }}>{goal.progress}% Completed</span>
                  </div>
                  <button className="goal-delete-btn" onClick={(e) => handleDeleteGoal(goal._id, e)}>🗑️</button>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: trackBg, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${goal.progress}%`, background: goal.color, transition: 'width 0.5s ease-out' }}></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: cardBg, padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px', border: `1px solid ${borderColor}` }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Update Progress</h3>
            <p style={{ color: mutedText, margin: '0 0 1.5rem 0' }}>{activeGoal?.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
              <input type="range" min="0" max="100" value={sliderValue} onChange={(e) => setSliderValue(e.target.value)} style={{ flex: 1, accentColor: activeGoal?.color }} />
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: activeGoal?.color, minWidth: '45px' }}>{sliderValue}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', border: 'none', background: 'transparent', color: mutedText, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={saveProgressUpdate} style={{ padding: '10px 16px', border: 'none', background: activeGoal?.color, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;