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
// @route   POST /api/v1/calendar/sync
// @desc    Update or create today's daily log
router.post('/sync', protect, async (req, res) => {
    try {
        const { dateString, waterIntake, tasksCompleted, totalTasks } = req.body;
        
        // Logic to determine the color of the calendar square
        let status = 'good'; // Blue square by default if they did *something*
        
        if (tasksCompleted === totalTasks && totalTasks > 0 && waterIntake >= 8) {
            status = 'perfect'; // Green square if everything is done!
        } else if (tasksCompleted === 0 && waterIntake === 0) {
            status = 'missed'; // Red square if nothing was done
        }

        // findOneAndUpdate with { upsert: true } is magic:
        // It updates today's log if it exists, or creates a brand new one if it doesn't!
        const log = await DailyLog.findOneAndUpdate(
            { userId: req.user._id, dateString: dateString },
            { waterIntake, tasksCompleted, totalTasks, status },
            { new: true, upsert: true } 
        );

        res.status(200).json(log);
    } catch (error) {
        console.error("Sync error:", error);
        res.status(500).json({ message: 'Server Error syncing daily log' });
    }
});
module.exports = router;