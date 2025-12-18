const logger = require('../utils/logger');

// Generic error handler to avoid leaking stack traces to clients
// while keeping them in the server logs.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    status,
    path: req.path,
    method: req.method,
    stack: isDevelopment ? err.stack : undefined,
  });
  
  // Prepare error response
  const errorResponse = {
    message: status >= 500 ? 'Internal server error' : err.message,
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.details,
    }),
  };
  
  // Handle validation errors
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors || err.details,
    });
  }
  
  // Handle Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Duplicate entry. This record already exists.',
    });
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      message: 'Invalid reference. The related record does not exist.',
    });
  }
  
  res.status(status).json(errorResponse);
};

module.exports = errorHandler;

