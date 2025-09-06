const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const certificateSchema = new mongoose.Schema({
    // Reference
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRegistration', required: true },

    // Certificate Details
    certificateId: { type: String, unique: true, required: true },
    recipientName: { type: String, required: true },
    recipientEmail: { type: String, required: true },

    // Certificate Content
    title: { type: String, required: true },
    description: { type: String },
    issueDate: { type: Date, default: Date.now },

    // Template and Generation
    template: { type: String }, // HTML template used
    generatedHtml: { type: String }, // Final HTML with data
    pdfUrl: { type: String }, // URL to generated PDF

    // Verification
    verificationCode: { type: String, unique: true, required: true },
    isVerified: { type: Boolean, default: true },

    // Status
    status: {
        type: String,
        enum: ['issued', 'revoked', 'expired'],
        default: 'issued'
    },

    // QR Code for verification
    qrCode: { type: String },

    // Email Status
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },

    // Metadata
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validUntil: { type: Date },

    // Additional Fields
    grade: { type: String },
    score: { type: Number },
    completionPercentage: { type: Number },

}, { timestamps: true });

// Indexes
certificateSchema.index({ event: 1, user: 1 }, { unique: true });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ event: 1 });
certificateSchema.index({ user: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ issueDate: -1 });

// Generate certificate ID and verification code before validation and saving
certificateSchema.pre('validate', function (next) {
    if (!this.certificateId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.certificateId = `CERT-${timestamp}-${random}`;
    }

    // Only generate verification code if not provided
    if (!this.verificationCode) {
        const code = Math.random().toString(36).substring(2, 15).toUpperCase();
        this.verificationCode = code;
    }

    next();
});

certificateSchema.pre('save', function (next) {
    if (!this.certificateId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.certificateId = `CERT-${timestamp}-${random}`;
    }

    // Only generate verification code if not provided
    if (!this.verificationCode) {
        const code = Math.random().toString(36).substring(2, 15).toUpperCase();
        this.verificationCode = code;
    }

    next();
});

certificateSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Certificate', certificateSchema);