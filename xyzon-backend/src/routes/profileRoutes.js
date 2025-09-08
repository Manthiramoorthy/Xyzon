const express = require('express');
const ProfileController = require('../controllers/profileController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// All profile routes require authentication
router.use(auth());

// Get user profile
router.get('/', ProfileController.getProfile);

// Update user profile
router.put('/', ProfileController.updateProfile);

// Upload profile picture
router.post('/picture', ProfileController.uploadMiddleware, ProfileController.uploadProfilePicture);

// Delete profile picture
router.delete('/picture', ProfileController.deleteProfilePicture);

module.exports = router;
