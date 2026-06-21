import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  // 3 Modes: 'live' (Green), 'reconnecting' (Yellow), 'offline' (Red)
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'live' : 'offline');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  // State hooks to keep track of network status across components
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('reconnecting');
      processSyncQueue();
    };
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run an initial check on boot to process any stuck queued actions
    if (navigator.onLine) processSyncQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- OUTBOX ARCHITECTURE ---
  // Read and store queued background operations safely in hardware memory
  const getQueue = () => JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
  const saveQueue = (queue) => localStorage.setItem('prodpro_sync_queue', JSON.stringify(queue));

  const addToQueue = useCallback((action, endpoint, method, payload = null) => {
    const queue = getQueue();
    const newRequest = { id: Date.now().toString(), action, endpoint, method, payload };
    queue.push(newRequest);
    saveQueue(queue);
  }, []);

  // Sequential execution engine to replay cached changes back to MongoDB in order
  const processSyncQueue = async () => {
    const queue = getQueue();
    if (queue.length === 0) {
      setNetworkStatus('live');
      return;
    }

    setNetworkStatus('reconnecting');
    const token = localStorage.getItem('token');
    if (!token) return;

    for (const req of queue) {
      try {
        const options = {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };
        if (req.payload) options.body = JSON.stringify(req.payload);

        const response = await fetch(`${API_URL}${req.endpoint}`, options);
        if (response.ok) {
          // Task successfully recorded on remote database node, remove from client queue
          const currentQueue = getQueue();
          const updatedQueue = currentQueue.filter(item => item.id !== req.id);
          saveQueue(updatedQueue);
        }
      } catch (error) {
        console.error("Reconnection replay sync failed. Retrying shortly.", error);
        setNetworkStatus('offline');
        return; // Halt stream loop if server goes down again mid-replay
      }
    }

    setNetworkStatus('live');
    // Trigger a page event so components know they need to refresh their states from the cloud
    window.dispatchEvent(new Event('sync-complete'));
  };

  // --- DATA SNAPSHOT CACHING MODULES ---
  // Saves copies of data down to device so updates remain visible during an offline reload
  const saveSnapshot = useCallback((key, data) => {
    localStorage.setItem(`snapshot_${key}`, JSON.stringify(data));
  }, []);

  const getSnapshot = useCallback((key) => {
    const cached = localStorage.getItem(`snapshot_${key}`);
    return cached ? JSON.parse(cached) : null;
  }, []);

  return (
    <SyncContext.Provider value={{ networkStatus, addToQueue, saveSnapshot, getSnapshot, isOffline: networkStatus === 'offline' }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);