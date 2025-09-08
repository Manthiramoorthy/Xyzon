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

// Admin routes
router.get('/admin/users', auth('admin'), ctrl.getAllUsers);
router.get('/admin/users/:userId', auth('admin'), ctrl.getUserById);
router.put('/admin/users/:userId/role', auth('admin'), ctrl.updateUserRole);
router.post('/admin/users/:userId/suspend', auth('admin'), ctrl.suspendUser);
router.post('/admin/users/:userId/unsuspend', auth('admin'), ctrl.unsuspendUser);
router.delete('/admin/users/:userId', auth('admin'), ctrl.deleteUser);

module.exports = router;
