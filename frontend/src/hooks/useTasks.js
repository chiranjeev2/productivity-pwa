// frontend/src/hooks/useTasks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue } from '../utils/syncQueue';

export const useTasks = () => {
  const queryClient = useQueryClient();

  // 1. FETCH TASKS: Read entirely from local Dexie database
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      return await db.tasks
        .filter(task => !task.isDeleted)
        .reverse()
        .sortBy('lastModified');
    }
  });

  // 2. CREATE TASK: Optimistic local write -> Queue -> Sync
  const addTask = useMutation({
    mutationFn: async (taskData) => {
      const clientGuid = uuidv4();
      const user = JSON.parse(localStorage.getItem('user'));
      
      const newTask = {
        ...taskData,
        clientGuid,
        user: user._id,
        status: 'Pending',
        isDeleted: false,
        lastModified: new Date().toISOString()
      };

      // Write to Local DB
      await db.tasks.put(newTask);
      // Queue for Backend Sync
      await addToSyncQueue('CREATE', 'tasks', clientGuid, newTask);
      
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      triggerBackgroundSync();
    }
  });

  // 3. UPDATE TASK
  const updateTask = useMutation({
    mutationFn: async ({ clientGuid, updates }) => {
      const updatedTask = { ...updates, lastModified: new Date().toISOString() };
      
      await db.tasks.update(clientGuid, updatedTask);
      await addToSyncQueue('UPDATE', 'tasks', clientGuid, updatedTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      triggerBackgroundSync();
    }
  });

  // 4. DELETE TASK (Soft Delete)
  const deleteTask = useMutation({
    mutationFn: async (clientGuid) => {
      const deletedTask = { isDeleted: true, lastModified: new Date().toISOString() };
      
      await db.tasks.update(clientGuid, deletedTask);
      await addToSyncQueue('DELETE', 'tasks', clientGuid, deletedTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      triggerBackgroundSync();
    }
  });

  return { tasks, isLoading, addTask, updateTask, deleteTask };
};

// Helper to wake up the Service Worker
const triggerBackgroundSync = async () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-data');
    } catch (err) {
      console.log('Background Sync could not be registered:', err);
    }
  }
};