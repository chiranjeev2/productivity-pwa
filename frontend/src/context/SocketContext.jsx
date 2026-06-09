import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if the user is actually logged in
    if (!user) return;

    // Grab the Vercel URL and strip the api path to get the root server URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const backendUrl = apiUrl.replace('/api/v1', '');

    // Initialize the connection WITH cross-origin production settings
    const newSocket = io(backendUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'] // Crucial for Vercel -> Render connection
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log("🟢 Live Sync Connected");
      // Put the user in their private room
      newSocket.emit('join_user_room', user._id);
    });

    newSocket.on('connect_error', (err) => {
      console.error("🔴 Live Sync Error:", err.message);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Clean up the connection if the user logs out or closes the app
    return () => newSocket.close();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};