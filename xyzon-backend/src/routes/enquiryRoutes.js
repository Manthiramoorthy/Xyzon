const express = require('express');
const EnquiryController = require('../controllers/enquiryController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Public routes - no authentication required
router.post('/submit', EnquiryController.submitEnquiry);

// Admin routes - require authentication and admin role
router.use(auth('admin')); // Apply authentication middleware to all routes below

// Get all enquiries with filters and pagination
router.get('/', EnquiryController.getAllEnquiries);

// Get enquiry statistics
router.get('/stats', EnquiryController.getEnquiryStats);

// Bulk actions on enquiries
router.post('/bulk-action', EnquiryController.bulkAction);

// Get single enquiry by ID
router.get('/:id', EnquiryController.getEnquiryById);

// Update enquiry (status, priority, assignment, notes)
router.put('/:id', EnquiryController.updateEnquiry);

// Send response to enquiry
router.post('/:id/respond', EnquiryController.sendResponse);

// Delete enquiry
router.delete('/:id', EnquiryController.deleteEnquiry);

module.exports = router;
