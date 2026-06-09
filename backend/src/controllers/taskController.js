// backend/src/controllers/taskController.js
const Task = require('../models/Task');

// GET /api/v1/tasks
exports.getTasks = async (req, res, next) => {
  try {
    // We only send tasks that haven't been soft-deleted
    const tasks = await Task.find({ user: req.user._id, isDeleted: false });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { clientGuid, title, description, priority, dueDate, socketId } = req.body;

    // Upsert logic: If it exists (due to retry), update it. Otherwise create it.
    const task = await Task.findOneAndUpdate(
      { clientGuid, user: req.user._id },
      { title, description, priority, dueDate, lastModified: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Broadcast the creation to user's other devices
    req.io.to(req.user._id.toString()).except(socketId).emit('sync-event', {
      type: 'TASK_UPSERT',
      payload: task
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/tasks/:clientGuid
exports.updateTask = async (req, res, next) => {
  try {
    const { status, priority, title, socketId } = req.body;

    const task = await Task.findOneAndUpdate(
      { clientGuid: req.params.clientGuid, user: req.user._id },
      { status, priority, title, lastModified: new Date() },
      { new: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found' });

    req.io.to(req.user._id.toString()).except(socketId).emit('sync-event', {
      type: 'TASK_UPSERT',
      payload: task
    });

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/tasks/:clientGuid (Soft Delete)
exports.deleteTask = async (req, res, next) => {
  try {
    const { socketId } = req.body;

    const task = await Task.findOneAndUpdate(
      { clientGuid: req.params.clientGuid, user: req.user._id },
      { isDeleted: true, lastModified: new Date() },
      { new: true }
    );

    req.io.to(req.user._id.toString()).except(socketId).emit('sync-event', {
      type: 'TASK_DELETED',
      payload: { clientGuid: req.params.clientGuid }
    });

    res.json({ message: 'Task marked as deleted' });
  } catch (error) {
    next(error);
  }
};