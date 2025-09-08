const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },

    // Profile Information
    profilePicture: { type: String }, // URL to profile image
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    collegeName: { type: String, trim: true },
    department: { type: String, trim: true },
    yearOfStudy: { type: String, trim: true },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'India' }
    },
    bio: { type: String, trim: true, maxlength: 500 },
    socialLinks: {
        linkedin: { type: String, trim: true },
        github: { type: String, trim: true },
        twitter: { type: String, trim: true },
        portfolio: { type: String, trim: true }
    },

    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
    resetToken: { token: String, expires: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
