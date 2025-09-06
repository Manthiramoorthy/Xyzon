const Payment = require('../models/Payment');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

class PaymentController {
    // Create Payment Order (called during registration)
    static async createOrder(req, res) {
        try {
            if (!razorpay) {
                return res.status(500).json({
                    success: false,
                    message: 'Payment service not configured'
                });
            }

            const { eventId, registrationId } = req.body;

            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            const registration = await EventRegistration.findById(registrationId);
            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Registration not found'
                });
            }

            // Create Razorpay order
            const options = {
                amount: event.price * 100, // Amount in paise
                currency: event.currency || 'INR',
                receipt: `receipt_${registration.registrationId}`,
                notes: {
                    eventId: event._id.toString(),
                    userId: req.user.id,
                    registrationId: registration.registrationId
                }
            };

            const razorpayOrder = await razorpay.orders.create(options);

            // Save payment record
            const payment = new Payment({
                user: req.user.id,
                event: eventId,
                registration: registrationId,
                amount: event.price,
                currency: event.currency || 'INR',
                razorpayOrderId: razorpayOrder.id,
                receipt: options.receipt,
                notes: options.notes
            });

            await payment.save();

            res.json({
                success: true,
                data: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    paymentId: payment._id
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Verify Payment
    static async verifyPayment(req, res) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            // Verify signature
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment signature'
                });
            }

            // Update payment status
            const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment record not found'
                });
            }

            payment.status = 'paid';
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.paidAt = new Date();
            await payment.save();

            // Update registration status
            await EventRegistration.findByIdAndUpdate(payment.registration, {
                paymentStatus: 'completed'
            });

            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: payment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get Payment Status
    static async getPaymentStatus(req, res) {
        try {
            const payment = await Payment.findById(req.params.id)
                .populate('event', 'title price')
                .populate('registration', 'registrationId name');

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            res.json({
                success: true,
                data: payment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get User's Payments
    static async getMyPayments(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: { createdAt: -1 },
                populate: [
                    { path: 'event', select: 'title description startDate banner' },
                    { path: 'registration', select: 'registrationId' }
                ]
            };

            const payments = await Payment.paginate(
                { user: req.user.id },
                options
            );

            res.json({
                success: true,
                data: payments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get Event Payments
    static async getEventPayments(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: { createdAt: -1 },
                populate: [
                    { path: 'user', select: 'name email' },
                    { path: 'registration', select: 'registrationId name' }
                ]
            };

            const payments = await Payment.paginate(
                { event: req.params.eventId },
                options
            );

            res.json({
                success: true,
                data: payments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Refund Payment
    static async refundPayment(req, res) {
        try {
            if (!razorpay) {
                return res.status(500).json({
                    success: false,
                    message: 'Payment service not configured'
                });
            }

            const { reason, amount } = req.body;
            const payment = await Payment.findById(req.params.id);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            if (payment.status !== 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment not eligible for refund'
                });
            }

            // Process refund with Razorpay
            const refundAmount = amount || payment.amount;
            const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
                amount: refundAmount * 100, // Amount in paise
                notes: {
                    reason: reason || 'Requested by admin'
                }
            });

            // Update payment record
            payment.status = 'refunded';
            payment.refundId = refund.id;
            payment.refundAmount = refundAmount;
            payment.refundReason = reason;
            payment.refundedAt = new Date();
            await payment.save();

            // Update registration status
            await EventRegistration.findByIdAndUpdate(payment.registration, {
                paymentStatus: 'refunded',
                status: 'cancelled'
            });

            res.json({
                success: true,
                message: 'Payment refunded successfully',
                data: {
                    payment,
                    refund
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get Payment Statistics
    static async getPaymentStatistics(req, res) {
        try {
            const { eventId } = req.params;

            // Total revenue
            const totalRevenue = await Payment.aggregate([
                { $match: { event: mongoose.Types.ObjectId(eventId), status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]);

            // Pending payments
            const pendingPayments = await Payment.countDocuments({
                event: eventId,
                status: { $in: ['created', 'attempted'] }
            });

            // Failed payments
            const failedPayments = await Payment.countDocuments({
                event: eventId,
                status: 'failed'
            });

            // Refunded payments
            const refundedPayments = await Payment.aggregate([
                { $match: { event: mongoose.Types.ObjectId(eventId), status: 'refunded' } },
                { $group: { _id: null, total: { $sum: '$refundAmount' }, count: { $sum: 1 } } }
            ]);

            res.json({
                success: true,
                data: {
                    totalRevenue: totalRevenue[0]?.total || 0,
                    paidCount: totalRevenue[0]?.count || 0,
                    pendingPayments,
                    failedPayments,
                    refundedAmount: refundedPayments[0]?.total || 0,
                    refundedCount: refundedPayments[0]?.count || 0
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = PaymentController;