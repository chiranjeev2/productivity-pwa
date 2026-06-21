import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SyncProvider, useSync } from './context/SyncContext';

// Pages
import Home from './pages/Home';
import Goals from './pages/Goals';
import Calendar from './pages/Calendar';
import { Login } from './pages/Login';

// Layout Components
import BottomNav from './components/layout/BottomNav';

// Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// 🔴 NEW: Live Connectivity Status Badge (Handles Live, Reconnecting, and Offline states)
const HeaderBadge = () => {
  const { networkStatus } = useSync();

  const getBadgeStyle = () => {
    switch (networkStatus) {
      case 'live':
        return { background: '#d1fae5', color: '#065f46', text: 'Live Sync Active' };
      case 'reconnecting':
        return { background: '#fef3c7', color: '#92400e', text: 'Reconnecting...' };
      case 'offline':
        return { background: '#fee2e2', color: '#991b1b', text: 'Offline Mode' };
      default:
        return { background: '#e2e8f0', color: '#334155', text: 'Syncing' };
    }
  };

  const currentBadge = getBadgeStyle();

  return (
    <div style={{
      background: currentBadge.background,
      color: currentBadge.color,
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
      display: 'inline-block'
    }}>
      {currentBadge.text}
    </div>
  );
};

// Application shell layout definitions
const AppLayout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Dynamic styles based on theme
  const navStyle = {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '1rem', 
    borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
    background: isDarkMode ? '#1e293b' : '#ffffff',
    position: 'sticky', 
    top: 0,
    zIndex: 1000
  };

  const btnStyle = {
    background: 'transparent', 
    border: `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`, 
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    padding: '6px 12px', 
    borderRadius: '8px', 
    cursor: 'pointer',
    fontWeight: 'bold'
  };

  return (
    <SocketProvider>
      <div className="app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP NAV: Only visible if logged in */}
        {user && (
          <nav style={navStyle}>
            <h2 style={{ margin: 0, fontFamily: 'system-ui', fontSize: '1.2rem' }}>ProdPro</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* 🔴 FIXED: Swapped placeholder connection element for reactive HeaderBadge */}
              <HeaderBadge />
              
              <button onClick={toggleTheme} style={{...btnStyle, fontSize: '1.2rem', padding: '4px 8px', border: 'none'}}>
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={logout} style={btnStyle}>Logout</button>
            </div>
          </nav>
        )}

        {/* MAIN CONTENT AREA */}
        <main style={{ padding: '1rem', paddingBottom: user ? '80px' : '1rem', flex: 1 }}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            
            {/* THE THREE PROTECTED DASHBOARD TABS */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            
            <Route path="*" element={<div style={{ textAlign: 'center', padding: '2rem' }}><h2>404 - Not Found</h2></div>} />
          </Routes>
        </main>

        {/* BOTTOM NAV: Only visible if logged in */}
        {user && <BottomNav />}

      </div>
    </SocketProvider>
  );
};

// Main App component wrapping context trees
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* 🔴 FIXED: Integrated SyncProvider securely inside AuthProvider to access local session parameters safely */}
        <SyncProvider>
          <Router>
            <AppLayout />
          </Router>
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;