const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { authenticateToken } = require('../middleware/auth');

// Get call history
router.get('/history', authenticateToken, callController.getCallHistory);

// Start a call
router.post('/start', authenticateToken, callController.startCall);

// End a call
router.post('/end', authenticateToken, callController.endCall);

// Get call statistics
router.get('/stats', authenticateToken, callController.getCallStats);

module.exports = router;