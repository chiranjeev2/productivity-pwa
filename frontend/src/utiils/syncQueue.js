// frontend/src/utils/syncQueue.js
import { db } from '../db/db';

export const addToSyncQueue = async (action, entity, clientGuid, payload) => {
  // Check if there is already a pending CREATE for this item.
  // If so, and we are now doing an UPDATE, we just update the payload of the CREATE 
  // instead of creating a second queue entry.
  const existingQueueItem = await db.syncQueue
    .where('clientGuid')
    .equals(clientGuid)
    .first();

  if (existingQueueItem && existingQueueItem.action === 'CREATE' && action === 'UPDATE') {
    await db.syncQueue.update(existingQueueItem.id, {
      payload: { ...existingQueueItem.payload, ...payload },
      timestamp: Date.now()
    });
    return;
  }

  await db.syncQueue.add({
    action, // 'CREATE', 'UPDATE', or 'DELETE'
    entity, // 'tasks', 'goals', or 'notes'
    clientGuid,
    payload,
    timestamp: Date.now()
  });
};