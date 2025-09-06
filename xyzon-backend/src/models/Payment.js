const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const paymentSchema = new mongoose.Schema({
    // Reference
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRegistration', required: true },

    // Payment Details
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    // Razorpay Details
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Payment Status
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'],
        default: 'created'
    },

    // Payment Method
    method: { type: String }, // card, netbanking, wallet, upi, etc.
    bank: { type: String },
    wallet: { type: String },

    // Timestamps
    paidAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },

    // Refund Info
    refundId: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },

    // Additional Info
    receipt: { type: String },
    notes: { type: Map, of: String },

    // Failure Info
    errorCode: { type: String },
    errorDescription: { type: String },

}, { timestamps: true });

// Indexes
paymentSchema.index({ user: 1 });
paymentSchema.index({ event: 1 });
paymentSchema.index({ registration: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

paymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Payment', paymentSchema);