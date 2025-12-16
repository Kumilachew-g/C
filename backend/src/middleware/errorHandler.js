const logger = require('../utils/logger');

// Generic error handler to avoid leaking stack traces to clients
// while keeping them in the server logs.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message;

  logger.error(err);
  res.status(status).json({ message });
};

module.exports = errorHandler;

