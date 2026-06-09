import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Goals.css';

const Goals = () => {
  const { isDarkMode } = useTheme();

  // Temporary UI State for Goals
  const [shortTermGoals] = useState([
    { id: 1, title: 'Complete Sigma MERN Module', progress: 85, color: '#3b82f6' }, // Blue
    { id: 2, title: 'Master DSA Arrays & Strings', progress: 40, color: '#8b5cf6' }  // Purple
  ]);

  const [longTermGoals] = useState([
    { id: 3, title: 'Secure 2027 Summer Internship', progress: 15, color: '#10b981' }, // Green
    { id: 4, title: 'Age 37 Retirement Milestone', progress: 5, color: '#f59e0b' }    // Orange
  ]);

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

      {/* SHORT-TERM GOALS PANEL */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🚀</span> Short-Term (This Semester)
        </h3>
        
        {shortTermGoals.map(goal => (
          <div key={goal.id} className="goal-card" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{goal.title}</span>
              <span style={{ fontWeight: 'bold', color: goal.color }}>{goal.progress}%</span>
            </div>
            {/* Progress Bar */}
            <div className="progress-track" style={{ background: trackBg }}>
              <div 
                className="progress-fill" 
                style={{ width: `${goal.progress}%`, background: goal.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* LONG-TERM GOALS PANEL */}
      <div>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏔️</span> Long-Term (The Big Picture)
        </h3>
        
        {longTermGoals.map(goal => (
          <div key={goal.id} className="goal-card" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{goal.title}</span>
              <span style={{ fontWeight: 'bold', color: goal.color }}>{goal.progress}%</span>
            </div>
            {/* Progress Bar */}
            <div className="progress-track" style={{ background: trackBg }}>
              <div 
                className="progress-fill" 
                style={{ width: `${goal.progress}%`, background: goal.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Goals;