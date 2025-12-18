require('dotenv').config();
const { validateEnv } = require('./utils/env');
const app = require('./app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { ensureRoleExists } = require('./services/authService');
const { ROLES } = require('./utils/roles');

// Validate environment variables before starting
validateEnv();

const PORT = process.env.PORT || 4000;

const bootstrap = async () => {
  try {
    await connectDB();
    logger.info('Database connected successfully');
    
    // Use alter: true in development to automatically add new columns
    // In production, use migrations instead
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false } 
      : { alter: true };
    
    await sequelize.sync(syncOptions);
    logger.info('Database models synchronized');
    
    // Ensure all roles exist
    await Promise.all(Object.values(ROLES).map((role) => ensureRoleExists(role)));
    logger.info('Roles initialized');
  } catch (error) {
    logger.error('Bootstrap failed: %s', error.message);
    throw error;
  }
};

bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 CEMS API listening on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 API URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    logger.error('❌ Startup failed: %s', error.message);
    logger.error(error.stack);
    process.exit(1);
  });

