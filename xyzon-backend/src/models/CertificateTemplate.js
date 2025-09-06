const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    htmlContent: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    previewImage: {
        type: String // Base64 or URL to preview image
    }
}, {
    timestamps: true
});

// Index for faster queries
certificateTemplateSchema.index({ name: 1, createdBy: 1 });
certificateTemplateSchema.index({ isActive: 1 });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
