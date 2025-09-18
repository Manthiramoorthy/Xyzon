const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // applies only for percentage type
    minAmount: { type: Number, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    usageLimit: { type: Number, min: 1 }, // total allowed redemptions
    perUserLimit: { type: Number, min: 1 },
    allowedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }], // if empty => all events
    active: { type: Boolean, default: true },
    // Tracking
    totalRedemptions: { type: Number, default: 0 },
    totalDiscountGiven: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ active: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

couponSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Coupon', couponSchema);