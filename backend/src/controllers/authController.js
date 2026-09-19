const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth', // only sent to auth routes (refresh/logout)
};

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  // Only allow self-registering as buyer or seller — never admin.
  const safeRole = ['buyer', 'seller'].includes(role) ? role : 'buyer';

  const user = await User.create({ name, email, password, role: safeRole });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push(refreshToken);
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({
    success: true,
    accessToken,
    user: user.toSafeObject(),
  });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push(refreshToken);
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    accessToken,
    user: user.toSafeObject(),
  });
});

/**
 * @route   POST /api/auth/refresh
 * @access  Public (requires valid refresh cookie)
 *
 * Rotates the refresh token on every use: the old one is invalidated and a
 * new one issued. This limits the damage if a refresh token is ever stolen.
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    // Token reuse or revoked token — treat as compromised, wipe all sessions.
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    res.status(401);
    throw new Error('Refresh token not recognized — please log in again');
  }

  // Rotate: remove old token, issue + store new one.
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  const newRefreshToken = generateRefreshToken(user);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  const newAccessToken = generateAccessToken(user);

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ success: true, accessToken: newAccessToken });
});

/**
 * @route   POST /api/auth/logout
 * @access  Public (requires refresh cookie)
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.sub).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
        await user.save();
      }
    } catch (err) {
      // Token already invalid/expired — nothing to clean up server-side.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(200).json({ success: true, message: 'Logged out' });
});

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

module.exports = { register, login, refresh, logout, getMe };

