// backend/src/controllers/syncController.js
const Task = require('../models/Task');
const Goal = require('../models/Goal');
const Note = require('../models/Note');

exports.processBatchSync = async (req, res, next) => {
  try {
    const { operations } = req.body;
    const userId = req.user._id;
    
    const results = { successful: 0, failed: 0 };

    // Process operations sequentially (or using Promise.all for speed)
    for (const op of operations) {
      try {
        let Model;
        if (op.entity === 'tasks') Model = Task;
        else if (op.entity === 'goals') Model = Goal;
        else if (op.entity === 'notes') Model = Note;

        if (!Model) continue;

        if (op.action === 'CREATE' || op.action === 'UPDATE') {
          // Upsert data using clientGuid
          await Model.findOneAndUpdate(
            { clientGuid: op.clientGuid, user: userId },
            { ...op.payload, user: userId, lastModified: op.payload.lastModified || new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } else if (op.action === 'DELETE') {
          // Soft delete
          await Model.findOneAndUpdate(
            { clientGuid: op.clientGuid, user: userId },
            { isDeleted: true, lastModified: new Date() }
          );
        }
        results.successful++;
      } catch (err) {
        console.error(`Failed to process op ${op.clientGuid}:`, err);
        results.failed++;
      }
    }

    // Tell the user's other active devices to refresh their data
    if (results.successful > 0) {
      req.io.to(userId.toString()).emit('sync-event', {
        type: 'BATCH_SYNC_COMPLETE',
        payload: { timestamp: Date.now() }
      });
    }

    res.status(200).json({ message: 'Batch processed', results });
  } catch (error) {
    next(error);
  }
};