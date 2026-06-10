const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware'); // Your auth middleware

// Get all tasks for today
router.get('/', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
});

// Create a new task
router.post('/', protect, async (req, res) => {
    try {
        const { text } = req.body;
        const task = await Task.create({
            userId: req.user._id,
            text,
            completed: false
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating task' });
    }
});

// Toggle task completion
router.put('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task || task.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        task.completed = !task.completed;
        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating task' });
    }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task || task.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        await task.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting task' });
    }
});

module.exports = router;