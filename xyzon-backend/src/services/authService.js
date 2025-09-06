const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const ACCESS_TTL = '2h';
const REFRESH_TTL_DAYS = 30; // manual tracking

function signAccess(user) {
    return jwt.sign({ sub: user._id, email: user.email, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh() {
    return crypto.randomBytes(48).toString('hex');
}

async function register({ name, email, password }) {
    const exists = await User.findOne({ email });
    if (exists) throw new Error('EMAIL_IN_USE');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return { id: user._id, email: user.email };
}

async function login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');
    const accessToken = signAccess(user);
    const refreshToken = signRefresh();
    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    return { accessToken, refreshToken, user: { id: user._id, email: user.email, name: user.name, role: user.role } };
}

async function rotateRefresh(oldToken) {
    const user = await User.findOne({ 'refreshTokens.token': oldToken });
    if (!user) throw new Error('INVALID_REFRESH');
    const entry = user.refreshTokens.find(rt => rt.token === oldToken);
    if (!entry) throw new Error('INVALID_REFRESH');
    // optional: revoke old
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== oldToken);
    const newToken = signRefresh();
    user.refreshTokens.push({ token: newToken });
    await user.save();
    return { accessToken: signAccess(user), refreshToken: newToken };
}

async function logout(refreshToken) {
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    if (!user) return; // idempotent
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await user.save();
}

async function requestPasswordReset(email) {
    const user = await User.findOne({ email });
    if (!user) return; // do not leak
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = { token, expires: new Date(Date.now() + 1000 * 60 * 15) };
    await user.save();
    return token;
}

async function resetPassword({ token, password }) {
    const user = await User.findOne({ 'resetToken.token': token, 'resetToken.expires': { $gt: new Date() } });
    if (!user) throw new Error('INVALID_OR_EXPIRED');
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    await user.save();
}

module.exports = { register, login, rotateRefresh, logout, requestPasswordReset, resetPassword };
