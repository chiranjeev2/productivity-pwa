const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const protect = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

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

module.exports = router;