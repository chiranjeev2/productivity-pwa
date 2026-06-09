import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css'; // We will create this next

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </NavLink>
      
      <NavLink to="/goals" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon">🎯</span>
        <span className="nav-label">Goals</span>
      </NavLink>

      <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon">🗓️</span>
        <span className="nav-label">Calendar</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;