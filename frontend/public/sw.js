// frontend/public/sw.js
// NOTE: This file is served as-is (not bundled by Vite), so import.meta.env
// is NOT available here. We derive the backend origin from the SW's own location
// so it works on both localhost and in production on Render without hardcoding.

importScripts('https://cdn.jsdelivr.net/npm/dexie@3/dist/dexie.min.js');

// Derive the API base from the Service Worker's registration scope
// e.g. https://productivity-pwa-chiranjeev2s-projects.vercel.app -> same origin
// The backend URL is stored in IndexedDB by the app on login.
const db = new Dexie('ProductivityProDB');
db.version(2).stores({
  syncQueue: '++id, action, entity, clientGuid, payload, timestamp',
  auth: 'id, token'
});

// Listen for the Background Sync event (fired by the browser when back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] 🔄 Background Sync triggered by browser');
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  try {
    // Grab all queued items, sorted oldest first
    const queue = await db.syncQueue.orderBy('timestamp').toArray();
    if (queue.length === 0) return;

    // Grab the auth token stored by the app at login
    const authRecord = await db.auth.get('current');
    if (!authRecord || !authRecord.token) {
      console.warn('[SW] No auth token found — skipping batch sync, will retry next time.');
      return;
    }

    // The backend URL is stored in the auth record by the app so the SW
    // doesn't need import.meta.env (which is unavailable in public/ SW files).
    const backendUrl = authRecord.backendUrl || 'https://prodpro-backend.onrender.com';
    const batchEndpoint = `${backendUrl}/api/v1/sync/batch`;

    const response = await fetch(batchEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authRecord.token}`
      },
      body: JSON.stringify({ operations: queue })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`[SW] Backend rejected batch sync: ${response.status} — ${body}`);
    }

    // Success — clear only the items we just sent
    const itemIds = queue.map(item => item.id);
    await db.syncQueue.bulkDelete(itemIds);
    console.log(`[SW] ✅ Successfully synced ${queue.length} offline operations`);

  } catch (error) {
    console.error('[SW] ❌ Background sync failed, will retry next time:', error);
    // Re-throwing tells the browser SyncManager to retry with backoff
    throw error;
  }
}