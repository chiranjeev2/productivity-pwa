const express = require('express');
const router = express.Router();
const { processBatchSync } = require('../controllers/syncController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/v1/sync/batch
// @desc    Process a batch of offline operations from the client outbox
router.post('/batch', protect, processBatchSync);

module.exports = router;
