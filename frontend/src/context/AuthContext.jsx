import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    // 🔴 NEW: Explicitly save the token to local storage
    if (data.token) localStorage.setItem('token', data.token); 
    setUser(data);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('user', JSON.stringify(data));
    // 🔴 NEW: Explicitly save the token to local storage
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('user');
    // 🔴 NEW: Make sure to delete the token when logging out
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token: user?.token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};