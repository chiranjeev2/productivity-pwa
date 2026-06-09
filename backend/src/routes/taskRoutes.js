const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const task = await Task.create({ user: req.user._id, title, completed: false });
    
    // ⚡ BROADCAST: Tell the user's frontend that their tasks changed!
    req.app.get('io').to(req.user._id.toString()).emit('tasks_updated');
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) return res.status(401).json({ error: 'Not authorized' });

    task.completed = !task.completed;
    const updatedTask = await task.save();
    
    // ⚡ BROADCAST
    req.app.get('io').to(req.user._id.toString()).emit('tasks_updated');
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) return res.status(401).json({ error: 'Not authorized' });

    await task.deleteOne();
    
    // ⚡ BROADCAST
    req.app.get('io').to(req.user._id.toString()).emit('tasks_updated');
    
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;