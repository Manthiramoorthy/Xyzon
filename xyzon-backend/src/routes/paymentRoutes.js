const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Create Razorpay order
router.post('/create-order', auth(), PaymentController.createOrder);

// Cancel pending payment
router.post('/:id/cancel', auth(), PaymentController.cancelPending);

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

// Get single payment (for detailed view / receipt)
router.get('/:id', auth(), PaymentController.getPaymentStatus);

// Admin: Get payment statistics
router.get('/admin/statistics', auth('admin'), PaymentController.getPaymentStatistics);

// Admin: Export payments to CSV
router.get('/admin/export', auth('admin'), PaymentController.exportPayments);

module.exports = router;
