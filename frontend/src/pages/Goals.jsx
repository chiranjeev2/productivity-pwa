import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Goals.css';

const Goals = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth(); // To attach the user's ID to the database request

  // Real Database State
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for creating new goals
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('short-term');

  // Backend URL (Make sure this matches your deployed Render URL or Vite Proxy)
  const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

  // 1. FETCH GOALS ON LOAD
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('token'); // Adjust if you store the token differently
        const response = await fetch(`${API_URL}/goals`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setGoals(data);
        }
      } catch (error) {
        console.error("Failed to fetch goals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [API_URL]);

  // 2. PUSH NEW GOAL TO DATABASE
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');
      // Assign specific colors based on the type
      const assignedColor = newType === 'short-term' ? '#3b82f6' : '#10b981';

      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          progress: 0, // Starts at 0%
          color: assignedColor
        })
      });

      if (response.ok) {
        const addedGoal = await response.json();
        // Immediately update the UI with the new database entry
        setGoals([addedGoal, ...goals]);
        setNewTitle(''); // Clear the input
      }
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  // 3. FILTER GOALS FOR THE UI
  const shortTermGoals = goals.filter(g => g.type === 'short-term');
  const longTermGoals = goals.filter(g => g.type === 'long-term');

  // Theme Colors
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const mutedText = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const trackBg = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ color: textColor, maxWidth: '600px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
          🎯 Vision Board
        </h1>
        <p style={{ fontSize: '1.1rem', color: mutedText, margin: 0, fontWeight: '500' }}>
          Track your strategic milestones.
        </p>
      </div>

      {/* 🔴 NEW: ADD GOAL FORM */}
      <form onSubmit={handleAddGoal} style={{ 
        display: 'flex', gap: '8px', marginBottom: '2rem', background: cardBg, 
        padding: '1rem', borderRadius: '12px', border: `1px solid ${borderColor}`
      }}>
        <input 
          type="text" 
          placeholder={newType === 'short-term' ? "e.g., Complete Sigma MERN Module" : "e.g., Retire by age 37 roadmap"} 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ 
            flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${borderColor}`,
            background: isDarkMode ? '#0f172a' : '#f8fafc', color: textColor, outline: 'none'
          }}
        />
        <select 
          value={newType} 
          onChange={(e) => setNewType(e.target.value)}
          style={{
            padding: '10px', borderRadius: '8px', border: `1px solid ${borderColor}`,
            background: isDarkMode ? '#0f172a' : '#f8fafc', color: textColor, outline: 'none'
          }}
        >
          <option value="short-term">Short Term</option>
          <option value="long-term">Long Term</option>
        </select>
        <button type="submit" style={{
          padding: '10px 16px', borderRadius: '8px', border: 'none', 
          background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
        }}>
          Add
        </button>
      </form>

      {isLoading ? (
        <p style={{ textAlign: 'center', color: mutedText }}>Syncing with database...</p>
      ) : (
        <>
          {/* SHORT-TERM GOALS PANEL */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> Short-Term (This Semester)
            </h3>
            
            {shortTermGoals.length === 0 && <p style={{ color: mutedText, fontStyle: 'italic' }}>No short-term goals yet.</p>}
            
            {shortTermGoals.map(goal => (
              <div key={goal._id} className="goal-card" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <div className="goal-header">
                  <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{goal.title}</span>
                  <span style={{ fontWeight: 'bold', color: goal.color }}>{goal.progress}%</span>
                </div>
                <div className="progress-track" style={{ background: trackBg }}>
                  <div className="progress-fill" style={{ width: `${goal.progress}%`, background: goal.color }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* LONG-TERM GOALS PANEL */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏔️</span> Long-Term (The Big Picture)
            </h3>
            
            {longTermGoals.length === 0 && <p style={{ color: mutedText, fontStyle: 'italic' }}>No long-term goals yet.</p>}
            
            {longTermGoals.map(goal => (
              <div key={goal._id} className="goal-card" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                <div className="goal-header">
                  <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{goal.title}</span>
                  <span style={{ fontWeight: 'bold', color: goal.color }}>{goal.progress}%</span>
                </div>
                <div className="progress-track" style={{ background: trackBg }}>
                  <div className="progress-fill" style={{ width: `${goal.progress}%`, background: goal.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Goals;