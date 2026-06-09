import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ConnectionStatus } from './components/ui/ConnectionStatus';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

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
    background: isDarkMode ? '#1e293b' : '#ffffff'
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
      {user && (
        <nav style={navStyle}>
          <h2 style={{ margin: 0, fontFamily: 'system-ui' }}>ProdPro</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ConnectionStatus />
            {/* THE NEW THEME TOGGLE BUTTON */}
            <button onClick={toggleTheme} style={{...btnStyle, fontSize: '1.2rem', padding: '4px 8px', border: 'none'}}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={logout} style={btnStyle}>Logout</button>
          </div>
        </nav>
      )}
      <main style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '2rem' }}><h2>404 - Not Found</h2></div>} />
        </Routes>
      </main>
    </SocketProvider>
  );
};

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