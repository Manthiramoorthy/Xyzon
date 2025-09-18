const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const Event = require('../models/Event');

function evaluateCouponValue(coupon, amount) {
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (amount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    } else {
        discount = coupon.discountValue;
    }
    if (discount < 0) discount = 0;
    if (discount > amount) discount = amount;
    return Math.round(discount * 100) / 100; // 2 decimals
}

async function validateCoupon(coupon, userId, eventId, amount) {
    const now = new Date();
    if (!coupon.active) throw new Error('Coupon is inactive');
    if (coupon.startDate && now < coupon.startDate) throw new Error('Coupon not started yet');
    if (coupon.endDate && now > coupon.endDate) throw new Error('Coupon expired');
    if (coupon.usageLimit && coupon.totalRedemptions >= coupon.usageLimit) throw new Error('Coupon usage limit reached');
    if (coupon.allowedEvents?.length && !coupon.allowedEvents.some(e => e.toString() === eventId.toString())) throw new Error('Coupon not valid for this event');
    if (coupon.minAmount && amount < coupon.minAmount) throw new Error(`Minimum amount of ${coupon.minAmount} required`);
    if (coupon.perUserLimit) {
        const userUsage = await Payment.countDocuments({ user: userId, couponCode: coupon.code, status: 'paid' });
        if (userUsage >= coupon.perUserLimit) throw new Error('Per user coupon limit reached');
    }
}

class CouponController {
    static async create(req, res) {
        try {
            const data = { ...req.body, code: req.body.code?.toUpperCase(), createdBy: req.user.id };
            const coupon = await Coupon.create(data);
            res.json({ success: true, data: coupon });
        } catch (e) { res.status(400).json({ success: false, message: e.message }); }
    }

    static async update(req, res) {
        try {
            const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
            res.json({ success: true, data: coupon });
        } catch (e) { res.status(400).json({ success: false, message: e.message }); }
    }

    static async list(req, res) {
        try {
            const { page = 1, limit = 20, active } = req.query;
            const filter = {};
            if (active !== undefined) filter.active = active === 'true';
            const coupons = await Coupon.paginate(filter, { page, limit, sort: { createdAt: -1 } });
            res.json({ success: true, data: coupons });
        } catch (e) { res.status(500).json({ success: false, message: e.message }); }
    }

    static async get(req, res) {
        try {
            const coupon = await Coupon.findById(req.params.id);
            if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
            res.json({ success: true, data: coupon });
        } catch (e) { res.status(500).json({ success: false, message: e.message }); }
    }

    static async delete(req, res) {
        try {
            const coupon = await Coupon.findByIdAndDelete(req.params.id);
            if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
            res.json({ success: true, message: 'Deleted' });
        } catch (e) { res.status(500).json({ success: false, message: e.message }); }
    }

    static async apply(req, res) {
        try {
            const { code, eventId, amount } = req.body;
            if (!code || !eventId || amount == null) return res.status(400).json({ success: false, message: 'code, eventId, amount required' });
            const coupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
            await validateCoupon(coupon, req.user.id, eventId, amount);
            const discount = evaluateCouponValue(coupon, amount);
            res.json({ success: true, data: { code: coupon.code, discount, finalAmount: amount - discount } });
        } catch (e) { res.status(400).json({ success: false, message: e.message }); }
    }
}

module.exports = { CouponController, evaluateCouponValue, validateCoupon };