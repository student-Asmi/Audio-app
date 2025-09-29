const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Get all users (with filtering)
router.get('/', authenticateToken, userController.getUsers);

// Get user profile
router.get('/profile', authenticateToken, userController.getProfile);

// Update user profile
router.put('/profile', authenticateToken, userController.updateProfile);

// Update online status
router.post('/online-status', authenticateToken, userController.updateOnlineStatus);

// Save push token
router.post('/push-token', authenticateToken, userController.savePushToken);

module.exports = router;