const { register, login, rotateRefresh, logout, requestPasswordReset, resetPassword } = require('../services/authService');
const User = require('../models/User');
const validator = require('validator');

function safeErr(e) {
    switch (e.message) {
        case 'EMAIL_IN_USE': return { status: 409, error: 'Email already registered' };
        case 'INVALID_CREDENTIALS': return { status: 401, error: 'Invalid credentials' };
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
