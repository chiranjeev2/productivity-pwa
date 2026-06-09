import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/'); // Go to dashboard on success
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', fontFamily: 'system-ui', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
        {isLogin ? 'Welcome Back' : 'Create an Account'}
      </h2>
      
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!isLogin && (
          <input 
            type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        )}
        <input 
          type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <input 
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" style={{ padding: '0.75rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '14px' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  );
};