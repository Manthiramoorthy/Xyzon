const express = require('express');
const router = express.Router();
const { CouponController } = require('../controllers/couponController');
const { auth } = require('../middleware/auth');

// Admin management
router.post('/', auth('admin'), CouponController.create);
router.get('/', auth('admin'), CouponController.list);
router.get('/:id', auth('admin'), CouponController.get);
router.put('/:id', auth('admin'), CouponController.update);
router.delete('/:id', auth('admin'), CouponController.delete);

// User apply (protected for logged-in users)
router.post('/apply/code', auth(), CouponController.apply);

module.exports = router;