import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Pages (Restored)
import Home from './pages/Home';
import Goals from './pages/Goals';
import Calendar from './pages/Calendar';
import { Login } from './pages/Login';

// Components (Restored)
import { ConnectionStatus } from './components/ui/ConnectionStatus';
import BottomNav from './components/layout/BottomNav';

// Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Extracted layout to use hooks inside the Router
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
    position: 'sticky', // Keeps header at the top
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
              <ConnectionStatus />
              <button onClick={toggleTheme} style={{...btnStyle, fontSize: '1.2rem', padding: '4px 8px', border: 'none'}}>
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={logout} style={btnStyle}>Logout</button>
            </div>
          </nav>
        )}

        {/* MAIN CONTENT AREA */}
        {/* We add paddingBottom: 80px so the bottom text doesn't hide behind the BottomNav */}
        <main style={{ padding: '1rem', paddingBottom: user ? '80px' : '1rem', flex: 1 }}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            
            {/* THE THREE RESTORED TABS */}
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

// Main App component wrapping everything
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;