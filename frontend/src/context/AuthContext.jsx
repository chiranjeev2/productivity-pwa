import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';
import { db } from '../db/db';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Persists the auth token + backend URL into IndexedDB so the Service Worker
// can read them during background sync (SW cannot access import.meta.env).
const persistAuthToDB = async (token) => {
  try {
    const backendUrl = (import.meta.env.VITE_API_URL || 'https://prodpro-backend.onrender.com')
      .replace('/api/v1', '');
    await db.auth.put({ id: 'current', token, backendUrl });
  } catch (e) {
    console.warn('Could not persist auth to IndexedDB:', e);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('token', data.token);
      await persistAuthToDB(data.token);
    }
    setUser(data);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('user', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('token', data.token);
      await persistAuthToDB(data.token);
    }
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Clear the IndexedDB auth record on logout
    db.auth.delete('current').catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token: user?.token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};