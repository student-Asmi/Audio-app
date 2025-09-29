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

router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router;