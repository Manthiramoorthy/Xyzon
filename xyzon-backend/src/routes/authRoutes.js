const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', auth(), ctrl.me);
router.post('/forgot-password', ctrl.forgot);
router.post('/reset-password', ctrl.reset);

module.exports = router;
