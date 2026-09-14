// frontend/src/db/db.js
import Dexie from 'dexie';

export const db = new Dexie('ProductivityProDB');

// Version 1 → 2 upgrade: added the 'auth' table for Service Worker token access
db.version(1).stores({
  tasks: 'clientGuid, user, title, status, priority, dueDate, isDeleted, lastModified',
  goals: 'clientGuid, user, title, progress, isCompleted, isDeleted, lastModified',
  notes: 'clientGuid, user, title, isPinned, isDeleted, lastModified',
  syncQueue: '++id, action, entity, clientGuid, payload, timestamp'
});

db.version(2).stores({
  tasks: 'clientGuid, user, title, status, priority, dueDate, isDeleted, lastModified',
  goals: 'clientGuid, user, title, progress, isCompleted, isDeleted, lastModified',
  notes: 'clientGuid, user, title, isPinned, isDeleted, lastModified',
  syncQueue: '++id, action, entity, clientGuid, payload, timestamp',
  // NEW: Store the token so the Service Worker can read it for batch sync
  auth: 'id, token'
});