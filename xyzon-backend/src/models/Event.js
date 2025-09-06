const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const registrationQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio'],
        required: true
    },
    options: [{ type: String }], // For select, checkbox, radio types
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
});

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },

    // Event Details
    eventType: { type: String, enum: ['paid', 'free'], required: true },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },

    // Dates and Times
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationStartDate: { type: Date, required: true },
    registrationEndDate: { type: Date, required: true },

    // Location/Link
    eventMode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
    eventLink: { type: String }, // For online events
    venue: { type: String }, // For offline events
    address: { type: String }, // For offline events

    // Media
    banner: { type: String }, // Banner image URL
    images: [{ type: String }], // Additional images

    // Capacity
    maxParticipants: { type: Number, min: 1 },
    currentParticipants: { type: Number, default: 0 },

    // Status
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },

    // Registration Questions
    registrationQuestions: [registrationQuestionSchema],

    // Certificate
    hasCertificate: { type: Boolean, default: false },
    certificateTemplate: { type: String }, // (legacy) Template HTML
    certificateTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate' }, // NEW: Reference to template
    certificateIssued: { type: Boolean, default: false },

    // Admin and Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    category: { type: String },

    // SEO
    slug: { type: String, unique: true },
    metaTitle: { type: String },
    metaDescription: { type: String },

    // Email Settings
    confirmationEmailSent: { type: Boolean, default: false },
    reminderEmailSent: { type: Boolean, default: false },

}, { timestamps: true });

// Indexes
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ slug: 1 });

// Generate slug before saving
eventSchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.title.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-')
            .substring(0, 50);
    }
    next();
});

// Virtual for registration status
eventSchema.virtual('registrationStatus').get(function () {
    const now = new Date();
    if (now < this.registrationStartDate) return 'not_started';
    if (now > this.registrationEndDate) return 'ended';
    if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) return 'full';
    return 'open';
});

// Virtual for event status
eventSchema.virtual('eventStatus').get(function () {
    const now = new Date();
    if (this.status === 'cancelled') return 'cancelled';
    if (now < this.startDate) return 'upcoming';
    if (now > this.endDate) return 'completed';
    return 'ongoing';
});

eventSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Event', eventSchema);