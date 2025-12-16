require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { ensureRoleExists } = require('./services/authService');
const { ROLES } = require('./utils/roles');

const PORT = process.env.PORT || 4000;

const bootstrap = async () => {
  await connectDB();
  await sequelize.sync();
  await Promise.all(Object.values(ROLES).map((role) => ensureRoleExists(role)));
};

bootstrap()
  .then(() => {
    app.listen(PORT, () => logger.info(`CEMS API listening on port ${PORT}`));
  })
  .catch((error) => {
    logger.error('Startup failed: %s', error.message);
    process.exit(1);
  });

