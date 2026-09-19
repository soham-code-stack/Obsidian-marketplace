const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokens');

/**
 * Requires a valid access token in the Authorization header.
 * On success, attaches the full user document (minus password) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized — invalid or expired token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Not authorized — user no longer exists or is deactivated');
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Use after `protect`.
 * Example: router.post('/products', protect, restrictTo('seller', 'admin'), handler)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied — requires one of roles: ${roles.join(', ')}`);
    }
    next();
  };
};

module.exports = { protect, restrictTo };

