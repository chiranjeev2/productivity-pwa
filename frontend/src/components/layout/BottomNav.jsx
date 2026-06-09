import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const BottomNav = () => {
  const { isDarkMode } = useTheme();

  const navContainerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '70px',
    // Switch background based on theme
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
  };

  const getLinkStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    // Switch text color based on theme
    color: isActive ? '#3b82f6' : (isDarkMode ? '#94a3b8' : '#64748b'),
    transform: isActive ? 'translateY(-3px) scale(1.05)' : 'none',
    transition: 'all 0.3s ease',
    fontWeight: isActive ? '600' : 'normal',
    padding: '8px 16px'
  });

  return (
    <nav style={navContainerStyle}>
      <NavLink to="/" style={({ isActive }) => getLinkStyle(isActive)}>
        <span style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</span>
        <span style={{ fontSize: '12px' }}>Home</span>
      </NavLink>
      <NavLink to="/goals" style={({ isActive }) => getLinkStyle(isActive)}>
        <span style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</span>
        <span style={{ fontSize: '12px' }}>Goals</span>
      </NavLink>
      <NavLink to="/calendar" style={({ isActive }) => getLinkStyle(isActive)}>
        <span style={{ fontSize: '24px', marginBottom: '4px' }}>🗓️</span>
        <span style={{ fontSize: '12px' }}>Calendar</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;