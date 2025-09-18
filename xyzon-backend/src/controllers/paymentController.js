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
            if (req.user && req.user.role === 'admin') {
                return res.status(403).json({ success: false, message: 'Admins cannot create payment orders for events.' });
            }
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

            const { eventId, couponCode } = req.body;
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
            let finalAmount = event.price;
            let discountAmount = 0;
            let appliedCoupon = null;

            if (couponCode) {
                try {
                    const Coupon = require('../models/Coupon');
                    const { evaluateCouponValue, validateCoupon } = require('./couponController');
                    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
                    if (!coupon) {
                        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
                    }
                    await validateCoupon(coupon, req.user.id, event._id, event.price);
                    discountAmount = evaluateCouponValue(coupon, event.price);
                    finalAmount = event.price - discountAmount;
                    appliedCoupon = coupon.code;
                } catch (e) {
                    return res.status(400).json({ success: false, message: e.message });
                }
            }

            if (finalAmount < 1) {
                finalAmount = 1; // Minimum 1 rupee to create order in Razorpay
            }

            const options = {
                amount: Math.round(finalAmount * 100),
                currency: event.currency || 'INR',
                receipt,
                notes: {
                    eventId: event._id.toString(),
                    userId: req.user.id,
                    coupon: appliedCoupon || undefined,
                    discount: discountAmount ? discountAmount.toString() : undefined
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


            // Detect existing pending payment and optionally reuse or cancel
            const existingPayment = await Payment.findOne({
                user: req.user.id,
                event: eventId,
                status: { $in: ['created', 'attempted'] }
            });
            if (existingPayment) {
                // Auto-expire if older than 10 minutes
                const thirtyMins = 10 * 60 * 1000;
                const age = Date.now() - new Date(existingPayment.createdAt).getTime();
                if (age > thirtyMins) {
                    existingPayment.status = 'cancelled';
                    existingPayment.canceledAt = new Date();
                    await existingPayment.save();
                } else {
                    // Allow client to request reuse instead of creating order again
                    if (req.body?.reuseExisting) {
                        return res.json({
                            success: true,
                            reused: true,
                            data: {
                                orderId: existingPayment.razorpayOrderId,
                                amount: existingPayment.amount * 100,
                                currency: existingPayment.currency,
                                paymentId: existingPayment._id
                            }
                        });
                    }
                    // Allow forced cancel via flag
                    if (req.body?.forceCancelExisting) {
                        existingPayment.status = 'cancelled';
                        existingPayment.canceledAt = new Date();
                        await existingPayment.save();
                    } else {
                        return res.status(400).json({
                            success: false,
                            code: 'PAYMENT_IN_PROGRESS',
                            message: 'A payment is already in progress for this event.',
                            action: 'reuse or cancel',
                            paymentId: existingPayment._id,
                            createdAt: existingPayment.createdAt,
                            canReuse: true,
                            canForceCancel: true
                        });
                    }
                }
            }

            const payment = new Payment({
                user: req.user.id,
                event: eventId,
                amount: finalAmount,
                originalAmount: event.price,
                discountAmount,
                couponCode: appliedCoupon,
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

    // Cancel a pending payment (user initiated)
    static async cancelPending(req, res) {
        try {
            const payment = await Payment.findOne({
                _id: req.params.id,
                user: req.user.id,
                status: { $in: ['created', 'attempted'] }
            });
            if (!payment) {
                return res.status(404).json({ success: false, message: 'Pending payment not found' });
            }
            payment.status = 'cancelled';
            payment.canceledAt = new Date();
            await payment.save();
            // Also mark linked registration (if any) back to pending or remove association
            if (payment.registration) {
                await EventRegistration.findByIdAndUpdate(payment.registration, { paymentStatus: 'pending', paymentId: null });
            }
            res.json({ success: true, message: 'Payment cancelled', data: { paymentId: payment._id } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
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

            // Update coupon stats if applied
            if (payment.couponCode) {
                const Coupon = require('../models/Coupon');
                await Coupon.findOneAndUpdate(
                    { code: payment.couponCode },
                    { $inc: { totalRedemptions: 1, totalDiscountGiven: payment.discountAmount || 0 } }
                );
            }

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
                .populate('event', 'title price startDate banner')
                .populate('registration', 'registrationId name')
                // Include limited user fields for invoice generation on frontend
                .populate('user', 'name email phone');

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
                    { path: 'registration', select: 'registrationId' },
                    // Provide user basics so frontend receipts can embed customer details without extra call
                    { path: 'user', select: 'name email phone' }
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
            const { eventId } = req.query; // Make eventId optional via query param

            let matchFilter = {};
            if (eventId) {
                matchFilter.event = mongoose.Types.ObjectId(eventId);
            }

            // Total revenue
            const totalRevenue = await Payment.aggregate([
                { $match: { ...matchFilter, status: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]);

            // Pending payments
            const pendingPayments = await Payment.countDocuments({
                ...matchFilter,
                status: { $in: ['created', 'attempted'] }
            });

            // Failed payments
            const failedPayments = await Payment.countDocuments({
                ...matchFilter,
                status: 'failed'
            });

            // Refunded payments
            const refundedPayments = await Payment.aggregate([
                { $match: { ...matchFilter, status: 'refunded' } },
                { $group: { _id: null, total: { $sum: '$refundAmount' }, count: { $sum: 1 } } }
            ]);

            // Payment method breakdown (only for paid payments)
            const paymentMethods = await Payment.aggregate([
                { $match: { ...matchFilter, status: 'paid', method: { $exists: true } } },
                { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
                { $sort: { count: -1 } }
            ]);

            // Daily revenue for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailyRevenue = await Payment.aggregate([
                {
                    $match: {
                        ...matchFilter,
                        status: 'paid',
                        paidAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$paidAt'
                            }
                        },
                        revenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            res.json({
                success: true,
                data: {
                    totalRevenue: totalRevenue[0]?.total || 0,
                    paidCount: totalRevenue[0]?.count || 0,
                    pendingPayments,
                    failedPayments,
                    refundedAmount: refundedPayments[0]?.total || 0,
                    refundedCount: refundedPayments[0]?.count || 0,
                    paymentMethods,
                    dailyRevenue
                }
            });
        } catch (error) {
            console.error('Error in getPaymentStatistics:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Export Payments to CSV
    static async exportPayments(req, res) {
        try {
            // Build filters
            const filters = {};
            if (req.query.status) filters.status = req.query.status;
            if (req.query.eventId) filters.event = req.query.eventId;
            if (req.query.userId) filters.user = req.query.userId;
            if (req.query.startDate || req.query.endDate) {
                filters.createdAt = {};
                if (req.query.startDate) filters.createdAt.$gte = new Date(req.query.startDate);
                if (req.query.endDate) filters.createdAt.$lte = new Date(req.query.endDate);
            }

            // Get all payments (no pagination for export)
            const payments = await Payment.find(filters)
                .populate('user', 'name email')
                .populate('event', 'title eventType')
                .sort({ createdAt: -1 });

            // Create CSV content
            const csvHeader = [
                'Payment ID',
                'User Name',
                'User Email',
                'Event Title',
                'Event Type',
                'Amount',
                'Currency',
                'Status',
                'Payment Method',
                'Razorpay Order ID',
                'Razorpay Payment ID',
                'Created At',
                'Paid At',
                'Refund Amount',
                'Refund Reason',
                'Refunded At'
            ].join(',');

            const csvRows = payments.map(payment => [
                payment._id,
                payment.user?.name || 'Unknown',
                payment.user?.email || 'Unknown',
                payment.event?.title || 'Event Deleted',
                payment.event?.eventType || 'N/A',
                payment.amount,
                payment.currency || 'INR',
                payment.status,
                payment.method || 'N/A',
                payment.razorpayOrderId,
                payment.razorpayPaymentId || 'N/A',
                payment.createdAt.toISOString(),
                payment.paidAt ? payment.paidAt.toISOString() : 'N/A',
                payment.refundAmount || 0,
                payment.refundReason || 'N/A',
                payment.refundedAt ? payment.refundedAt.toISOString() : 'N/A'
            ].map(field => `"${field}"`).join(','));

            const csvContent = [csvHeader, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=payments-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csvContent);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = PaymentController;