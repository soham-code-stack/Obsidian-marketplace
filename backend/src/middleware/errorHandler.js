/**
 * Catches 404s for unmatched routes.
 */
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found — ${req.originalUrl}`));
};

/**
 * Centralized error handler. express-async-handler forwards thrown errors
 * here via next(err), so controllers can just `throw new Error(...)`.
 */
const errorHandler = (err, req, res, next) => {
  // If a status was already set (e.g. res.status(400) before throwing), use it;
  // otherwise default to 500.
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Handle common Mongoose errors with friendlier messages.
  let message = err.message;

  if (err.name === 'CastError') {
    message = `Invalid value for field '${err.path}'`;
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field '${field}' — already exists`;
  }
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };

