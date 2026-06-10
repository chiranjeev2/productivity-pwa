const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/v1/calendar
// @desc    Get all historical logs for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const logs = await DailyLog.find({ userId: req.user._id });
        res.status(200).json(logs);
    } catch (error) {
        console.error("Calendar fetch error:", error);
        res.status(500).json({ message: 'Server Error fetching calendar logs' });
    }
});

module.exports = router;