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

  // 🔴 FIXED: Added optional tempId parameter to map client IDs to database keys
  const addToQueue = useCallback((action, endpoint, method, payload = null, tempId = null) => {
    const queue = getQueue();
    const newRequest = { id: Date.now().toString(), action, endpoint, method, payload, tempId };
    queue.push(newRequest);
    saveQueue(queue);
  }, []);

  // 🔴 FIXED: Sequential Replay Engine with Dynamic Identifier Rewriting
  const processSyncQueue = async () => {
    let queue = getQueue();
    if (queue.length === 0) {
      setNetworkStatus('live');
      return;
    }

    setNetworkStatus('reconnecting');
    const token = localStorage.getItem('token');
    if (!token) return;

    // Dictionary tracking runtime ID translations: { tempId: serverId }
    const idMap = {};

    while (queue.length > 0) {
      let req = queue[0]; // Intercept the head element of the transactional queue

      // Dynamic URL scanning: Rewrite endpoint string values if they reference a mapped client ID
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

          // If operation was an creation event, record the true server key mapping allocation
          if ((req.action === 'ADD_TASK' || req.action === 'ADD_GOAL') && resData && resData._id && req.tempId) {
            idMap[req.tempId] = resData._id;
          }

          // Safely evict processed action block out of hardware arrays
          const currentQueue = JSON.parse(localStorage.getItem('prodpro_sync_queue')) || [];
          const updatedQueue = currentQueue.filter(item => item.id !== req.id);
          saveQueue(updatedQueue);
          
          // Re-index remaining array components for subsequent runtime evaluations
          queue = updatedQueue;
        } else {
          // Server returned error flag, fallback to offline state safety
          setNetworkStatus('offline');
          return;
        }
      } catch (error) {
        console.error("Outbox replay transaction failure:", error);
        setNetworkStatus('offline');
        return;
      }
    }

    setNetworkStatus('live');
    // Notify application views to fetch clean, server-validated datasets
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