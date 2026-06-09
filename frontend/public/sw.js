// frontend/public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import Dexie from 'dexie';

// 1. Precache the App Shell (Vite handles injecting the manifest)
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. Initialize DB access inside the worker
const db = new Dexie('ProductivityProDB');
db.version(2).stores({
  syncQueue: '++id, action, entity, clientGuid, payload, timestamp',
  auth: 'id, token'
});

// 3. Listen for the Background Sync Event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('🔄 Background Sync triggered by browser');
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  try {
    // Grab all queued items, sorted by oldest first
    const queue = await db.syncQueue.orderBy('timestamp').toArray();
    if (queue.length === 0) return;

    // Grab the auth token
    const authRecord = await db.auth.get('current');
    if (!authRecord || !authRecord.token) throw new Error('No auth token available for background sync');

    // Send the entire queue as a batch to the backend
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authRecord.token}`
      },
      body: JSON.stringify({ operations: queue })
    });

    if (!response.ok) throw new Error('Backend rejected batch sync');

    // If successful, clear the sync queue locally
    const itemIds = queue.map(item => item.id);
    await db.syncQueue.bulkDelete(itemIds);
    console.log(`✅ Successfully synced ${queue.length} background operations`);

  } catch (error) {
    console.error('❌ Background sync failed, will retry next time:', error);
    // Throwing an error tells the browser's SyncManager to try again later
    throw error; 
  }
}