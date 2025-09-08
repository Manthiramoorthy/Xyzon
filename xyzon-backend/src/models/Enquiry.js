const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const enquirySchema = new mongoose.Schema({
    // Basic Information
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, trim: true },

    // Enquiry Details
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    category: {
        type: String,
        enum: ['general', 'support', 'partnership', 'feedback', 'other'],
        default: 'general'
    },

    // Status Management
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Admin Management
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNotes: [{
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],

    // Response Management
    responses: [{
        subject: String,
        message: String,
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sentAt: { type: Date, default: Date.now },
        emailSent: { type: Boolean, default: false }
    }],

    // Tracking
    ipAddress: String,
    userAgent: String,
    source: { type: String, default: 'website' }, // website, api, mobile

    // Timestamps
    resolvedAt: Date,
    firstResponseAt: Date,
    lastResponseAt: Date,
}, {
    timestamps: true
});

// Indexes for better performance
enquirySchema.index({ status: 1 });
enquirySchema.index({ category: 1 });
enquirySchema.index({ priority: 1 });
enquirySchema.index({ email: 1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ assignedTo: 1 });

// Virtual for response count
enquirySchema.virtual('responseCount').get(function () {
    return this.responses ? this.responses.length : 0;
});

// Virtual for time since creation
enquirySchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'Just now';
});

// Pre-save middleware to update timestamps
enquirySchema.pre('save', function (next) {
    if (this.isModified('responses') && this.responses.length > 0) {
        const latestResponse = this.responses[this.responses.length - 1];
        this.lastResponseAt = latestResponse.sentAt;

        if (!this.firstResponseAt) {
            this.firstResponseAt = latestResponse.sentAt;
        }
    }

    if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
        this.resolvedAt = new Date();
    }

    next();
});

enquirySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Enquiry', enquirySchema);
