const { AuditLog } = require('../models');

const auditLogger = (action, entity) => (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    if (!req.user) return;
    try {
      await AuditLog.create({
        userId: req.user.id,
        action,
        entity,
        entityId: res.locals.entityId || null,
        metadata: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
        },
      });
    } catch (error) {
      // Avoid crashing request due to logging failures
      // eslint-disable-next-line no-console
      console.error('Audit log failed', error.message);
    }
  });

  return next();
};

module.exports = auditLogger;

