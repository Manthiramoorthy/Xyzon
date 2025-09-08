const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Create Razorpay order
router.post('/create-order', auth(), PaymentController.createOrder);

// Verify payment (optional, if you want to move it here)
// router.post('/verify', auth(), PaymentController.verifyPayment);


// Get current user's payments
router.get('/user/my-payments', auth(), PaymentController.getMyPayments);

// Admin: Get all payments
router.get('/admin/all-payments', auth('admin'), PaymentController.getAllPayments);

// Admin: Get event payments
router.get('/event/:eventId/payments', auth('admin'), PaymentController.getEventPayments);

// Admin: Refund payment
router.post('/:id/refund', auth('admin'), PaymentController.refundPayment);

// Admin: Get payment statistics
router.get('/admin/statistics', auth('admin'), PaymentController.getPaymentStatistics);

module.exports = router;
