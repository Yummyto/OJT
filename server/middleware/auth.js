const jwt = require('jsonwebtoken');

/**
 * Middleware that verifies the JWT token from the Authorization header.
 * Attaches the decoded admin payload to req.admin.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional auth — sets req.admin if token present, but doesn't block.
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.admin = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_e) {
      // Token invalid — just proceed without admin
    }
  }

  next();
}

module.exports = { auth, optionalAuth };
