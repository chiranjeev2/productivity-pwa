const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/v1/goals
// @desc    Get all goals for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching goals' });
    }
});

// @route   POST /api/v1/goals
// @desc    Create a new goal
router.post('/', protect, async (req, res) => {
    try {
        const { title, type, progress, color } = req.body;
        
        const goal = await Goal.create({
            userId: req.user._id,
            title,
            type,
            progress: progress || 0,
            color: color || '#3b82f6'
        });

        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: 'Server Error creating goal' });
    }
});

// @route   PUT /api/v1/goals/:id
// @desc    Update a goal's progress via the frontend slider
router.put('/:id', protect, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Only allow the owner to update it
        if (goal.userId && goal.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update the progress number
        if (req.body.progress !== undefined) {
            goal.progress = req.body.progress;
        }

        const updatedGoal = await goal.save();
        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ message: 'Server error updating goal' });
    }
});

// @route   DELETE /api/v1/goals/:id
// @desc    Delete a goal (Useful if you add a delete button later)
router.delete('/:id', protect, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        if (goal.userId && goal.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await goal.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting goal' });
    }
});

module.exports = router;