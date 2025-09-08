const { register, login, rotateRefresh, logout, requestPasswordReset, resetPassword } = require('../services/authService');
const User = require('../models/User');
const validator = require('validator');

function safeErr(e) {
    switch (e.message) {
        case 'EMAIL_IN_USE': return { status: 409, error: 'Email already registered' };
        case 'INVALID_CREDENTIALS': return { status: 401, error: 'Invalid credentials' };
        case 'ACCOUNT_SUSPENDED': return { status: 403, error: 'Account has been suspended' };
        case 'INVALID_REFRESH': return { status: 401, error: 'Invalid refresh token' };
        case 'INVALID_OR_EXPIRED': return { status: 400, error: 'Invalid or expired token' };
        default: return { status: 500, error: 'Server error' };
    }
}

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
        if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email' });
        if (password.length < 8) return res.status(400).json({ error: 'Password too short' });
        const out = await register({ name, email, password });
        res.status(201).json({ message: 'Registered', user: out });
    } catch (e) { const se = safeErr(e); res.status(se.status).json({ error: se.error }); }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
        const { accessToken, refreshToken, user } = await login({ email, password });
        res.json({ accessToken, refreshToken, user });
    } catch (e) { const se = safeErr(e); res.status(se.status).json({ error: se.error }); }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Missing token' });
        const tokens = await rotateRefresh(refreshToken);
        res.json(tokens);
    } catch (e) { const se = safeErr(e); res.status(se.status).json({ error: se.error }); }
};

exports.logout = async (req, res) => {
    try { const { refreshToken } = req.body; if (refreshToken) await logout(refreshToken); res.json({ message: 'Logged out' }); } catch { res.json({ message: 'Logged out' }); }
}

exports.me = async (req, res) => {
    const user = await User.findById(req.user.sub).select('_id name email role createdAt');
    res.json({ user });
};

exports.forgot = async (req, res) => {
    try { const { email } = req.body; if (!email) return res.status(400).json({ error: 'Missing email' }); const token = await requestPasswordReset(email); res.json({ message: 'If account exists, reset email sent', token }); } catch (e) { res.status(500).json({ error: 'Server error' }); }
};

exports.reset = async (req, res) => {
    try { const { token, password } = req.body; if (!token || !password) return res.status(400).json({ error: 'Missing fields' }); await resetPassword({ token, password }); res.json({ message: 'Password updated' }); } catch (e) { const se = safeErr(e); res.status(se.status).json({ error: se.error }); }
};

// Admin endpoints
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, status } = req.query;

        const query = {};

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role && role !== 'all') {
            query.role = role;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.isActive = status === 'active';
        }

        const users = await User.find(query)
            .select('-passwordHash -refreshTokens -resetToken')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                docs: users,
                totalDocs: total,
                limit: parseInt(limit),
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (e) {
        const se = safeErr(e);
        res.status(se.status).json({ success: false, error: se.error });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-passwordHash -refreshTokens -resetToken');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (e) {
        const se = safeErr(e);
        res.status(se.status).json({ success: false, error: se.error });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { userId } = req.params;

        if (!['user', 'admin', 'moderator'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-passwordHash -refreshTokens -resetToken');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    } catch (e) {
        const se = safeErr(e);
        res.status(se.status).json({ success: false, error: se.error });
    }
};

exports.suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select('-passwordHash -refreshTokens -resetToken');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Clear refresh tokens to force logout
        await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });

        res.json({
            success: true,
            message: 'User suspended successfully',
            data: user
        });
    } catch (e) {
        const se = safeErr(e);
        res.status(se.status).json({ success: false, error: se.error });
    }
};

exports.unsuspendUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: true },
            { new: true }
        ).select('-passwordHash -refreshTokens -resetToken');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User unsuspended successfully',
            data: user
        });
    } catch (e) {
        const se = safeErr(e);
        res.status(se.status).json({ success: false, error: se.error });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Don't allow deleting admin users (except by other admins)
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (userToDelete.role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Cannot delete admin user' });
        }

        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (e) {
        const se = safeErr(e);
        res.status(se.status).json({ success: false, error: se.error });
    }
};
