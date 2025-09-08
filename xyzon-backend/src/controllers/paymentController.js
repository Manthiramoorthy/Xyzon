const Payment = require('../models/Payment');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize Razorpay only if credentials are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
} else {
    console.warn('Razorpay credentials are not set. Payment functionalities will be disabled.');
}

class PaymentController {
    // Create Payment Order (called during registration)
    static async createOrder(req, res) {
        try {
            if (!razorpay) {
                console.error('Razorpay not initialized. ENV:', {
                    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
                    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '***' : undefined
                });
                return res.status(500).json({
                    success: false,
                    message: 'Payment service not configured',
                    env: {
                        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
                        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '***' : undefined
                    }
                });
            }

            const { eventId } = req.body;
            if (!eventId) {
                console.error('Missing eventId in request body:', req.body);
                return res.status(400).json({
                    success: false,
                    message: 'Missing eventId in request body',
                    body: req.body
                });
            }

            const event = await Event.findById(eventId);
            if (!event) {
                console.error('Event not found for eventId:', eventId);
                return res.status(404).json({
                    success: false,
                    message: 'Event not found',
                    eventId
                });
            }

            // Create Razorpay order
            // Razorpay requires receipt to be <= 40 chars
            let baseReceipt = `receipt_${event._id}`;
            if (baseReceipt.length > 32) baseReceipt = baseReceipt.slice(0, 32);
            const receipt = `${baseReceipt}_${Date.now()}`.slice(0, 40);
            // Validate minimum price for Razorpay (must be at least 1)
            if (!event.price || event.price < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Event price must be at least 1 rupee for paid events.'
                });
            }
            const options = {
                amount: event.price * 100,
                currency: event.currency || 'INR',
                receipt,
                notes: {
                    eventId: event._id.toString(),
                    userId: req.user.id
                }
            };

            console.log('Creating Razorpay order with options:', options);

            let razorpayOrder;
            try {
                razorpayOrder = await razorpay.orders.create(options);
            } catch (err) {
                console.error('Error creating Razorpay order:', err, options);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create Razorpay order',
                    error: err.message,
                    options
                });
            }


            // Prevent duplicate payment records for the same user/event if one is already pending/created
            const existingPayment = await Payment.findOne({
                user: req.user.id,
                event: eventId,
                status: { $in: ['created', 'attempted'] }
            });
            if (existingPayment) {
                return res.status(400).json({
                    success: false,
                    message: 'A payment is already in progress for this event. Please complete or cancel the previous payment before trying again.'
                });
            }

            const payment = new Payment({
                user: req.user.id,
                event: eventId,
                amount: event.price,
                currency: event.currency || 'INR',
                razorpayOrderId: razorpayOrder.id,
                receipt: options.receipt,
                notes: options.notes
            });

            try {
                await payment.save();
            } catch (err) {
                console.error('Error saving payment record:', err, payment);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save payment record',
                    error: err.message
                });
            }

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
            console.error('Unhandled error in createOrder:', error, req.body);
            res.status(500).json({
                success: false,
                message: error.message,
                stack: error.stack,
                body: req.body
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

    // Admin: Get All Payments
    static async getAllPayments(req, res) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sort: { createdAt: -1 },
                populate: [
                    { path: 'user', select: 'name email' },
                    { path: 'event', select: 'title eventType price' },
                    { path: 'registration', select: 'registrationId name' }
                ]
            };

            // Add filters if provided
            const filters = {};
            if (req.query.status) {
                filters.status = req.query.status;
            }
            if (req.query.eventId) {
                filters.event = req.query.eventId;
            }
            if (req.query.userId) {
                filters.user = req.query.userId;
            }
            if (req.query.startDate || req.query.endDate) {
                filters.createdAt = {};
                if (req.query.startDate) {
                    filters.createdAt.$gte = new Date(req.query.startDate);
                }
                if (req.query.endDate) {
                    filters.createdAt.$lte = new Date(req.query.endDate);
                }
            }

            const payments = await Payment.paginate(filters, options);

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