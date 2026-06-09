import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check local storage first, default to light mode if nothing is saved
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Whenever the theme changes, update the physical HTML body and save to storage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';
    document.body.style.color = isDarkMode ? '#f8fafc' : '#0f172a';
    document.body.style.margin = '0'; // Clean up browser defaults
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};