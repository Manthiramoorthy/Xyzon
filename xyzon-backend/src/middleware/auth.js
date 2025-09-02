const jwt = require('jsonwebtoken');

function auth(requiredRole) {
    return (req, res, next) => {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
        try {
            const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            if (requiredRole && payload.role !== requiredRole) return res.status(403).json({ error: 'FORBIDDEN' });
            req.user = payload;
            next();
        } catch (e) {
            return res.status(401).json({ error: 'INVALID_TOKEN' });
        }
    };
}

module.exports = { auth };
