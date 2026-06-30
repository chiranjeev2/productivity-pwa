import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'live' : 'offline');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('reconnecting');
      processSyncQueue();
    };
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) processSyncQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getQueue = () => JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
  const saveQueue = (queue) => localStorage.setItem('prodpro_sync_queue', JSON.stringify(queue));

  const addToQueue = useCallback((action, endpoint, method, payload = null, tempId = null) => {
    const queue = getQueue();
    const newRequest = { id: Date.now().toString(), action, endpoint, method, payload, tempId };
    queue.push(newRequest);
    saveQueue(queue);
  }, []);

  const processSyncQueue = async () => {
    let queue = getQueue();
    if (queue.length === 0) {
      setNetworkStatus('live');
      return;
    }

    setNetworkStatus('reconnecting');
    const token = localStorage.getItem('token');
    if (!token) return;

    const idMap = {};

    while (queue.length > 0) {
      let req = queue[0];

      let targetEndpoint = req.endpoint;
      Object.keys(idMap).forEach(tempId => {
        if (targetEndpoint.includes(tempId)) {
          targetEndpoint = targetEndpoint.replace(tempId, idMap[tempId]);
        }
      });

      try {
        const options = {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };
        if (req.payload) options.body = JSON.stringify(req.payload);

        const response = await fetch(`${API_URL}${targetEndpoint}`, options);
        
        if (response.ok) {
          const resData = await response.json();

          if ((req.action === 'ADD_TASK' || req.action === 'ADD_GOAL') && resData && resData._id && req.tempId) {
            idMap[req.tempId] = resData._id;
          }

          const currentQueue = JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
          const updatedQueue = currentQueue.filter(item => item.id !== req.id);
          saveQueue(updatedQueue);
          queue = updatedQueue;
        } 
        // 🔴 FIXED: Data/Validation Errors (400-499) mean the server IS online.
        // Evict the bad item instead of locking the application offline forever.
        else if (response.status >= 400 && response.status < 500) {
          console.warn(`Evicting invalid outbox item [${req.action}] due to client error status: ${response.status}`);
          const currentQueue = JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
          const updatedQueue = currentQueue.filter(item => item.id !== req.id);
          saveQueue(updatedQueue);
          queue = updatedQueue;
        } 
        // Server drops or 500 errors mean we try again later
        else {
          setNetworkStatus('offline');
          return;
        }
      } catch (error) {
        // 🔴 Fetch threw an actual exception (True connection drop or timeout)
        console.error("Outbox network request failed completely:", error);
        setNetworkStatus('offline');
        return;
      }
    }

    setNetworkStatus('live');
    window.dispatchEvent(new Event('sync-complete'));
  };

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