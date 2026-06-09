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

    // Connect to the Node backend
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Put the user in their private room
      newSocket.emit('join_user_room', user._id);
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