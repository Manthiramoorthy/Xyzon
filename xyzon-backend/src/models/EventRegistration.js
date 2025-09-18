const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const registrationAnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    question: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true }
});

const eventRegistrationSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Registration Info
    registrationId: { type: String, unique: true, required: true },

    // Personal Info (in case user is not registered)
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    // Registration Answers
    answers: [registrationAnswerSchema],

    // Payment Info
    paymentRequired: { type: Boolean, required: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    amount: { type: Number, default: 0 },

    // Status
    status: {
        type: String,
        enum: ['registered', 'attended', 'absent', 'cancelled'],
        default: 'registered'
    },

    // QR Code for check-in
    qrCode: { type: String },

    // Certificate
    certificateIssued: { type: Boolean, default: false },
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    certificateIssuedAt: { type: Date },

    // Check-in Info
    checkedIn: { type: Boolean, default: false },
    checkInTime: { type: Date },
    checkInMethod: { type: String, enum: ['qr', 'manual', 'auto'] },

    // Email Status
    confirmationEmailSent: { type: Boolean, default: false },
    reminderEmailSent: { type: Boolean, default: false },
    certificateEmailSent: { type: Boolean, default: false },

}, { timestamps: true });

// Indexes
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ registrationId: 1 });
eventRegistrationSchema.index({ event: 1 });
eventRegistrationSchema.index({ user: 1 });
eventRegistrationSchema.index({ status: 1 });
eventRegistrationSchema.index({ paymentStatus: 1 });

// Generate registration ID before saving
eventRegistrationSchema.pre('save', function (next) {
    if (!this.registrationId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.registrationId = `REG-${timestamp}-${random}`;
    }
    next();
});

eventRegistrationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);