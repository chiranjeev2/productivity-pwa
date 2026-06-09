// frontend/src/db/db.js
import Dexie from 'dexie';

export const db = new Dexie('ProductivityProDB');

// Declare tables, primary keys, and indexed properties
db.version(1).stores({
  tasks: 'clientGuid, user, title, status, priority, dueDate, isDeleted, lastModified',
  goals: 'clientGuid, user, title, progress, isCompleted, isDeleted, lastModified',
  notes: 'clientGuid, user, title, isPinned, isDeleted, lastModified',
  
  // The queue stores the API request details to be replayed later
  syncQueue: '++id, action, entity, clientGuid, payload, timestamp'
});
// frontend/src/db/db.js
import Dexie from 'dexie';

export const db = new Dexie('ProductivityProDB');

db.version(2).stores({ // Bumped version to 2
  tasks: 'clientGuid, user, title, status, priority, dueDate, isDeleted, lastModified',
  goals: 'clientGuid, user, title, progress, isCompleted, isDeleted, lastModified',
  notes: 'clientGuid, user, title, isPinned, isDeleted, lastModified',
  syncQueue: '++id, action, entity, clientGuid, payload, timestamp',
  
  // NEW: Store the token for the Service Worker
  auth: 'id, token' 
});