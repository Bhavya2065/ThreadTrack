const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. Invalid token format.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
            }

            next();
        } catch (err) {
            res.status(400).json({ error: 'Invalid token.' });
        }
    };
};

module.exports = auth;
