const { sequelize } = require('../config/database');
const defineRole = require('./role');
const defineUser = require('./user');
const defineEngagement = require('./engagement');
const defineAuditLog = require('./auditLog');
const defineDepartment = require('./department');
const definePosition = require('./position');
const defineCommissionerProfile = require('./commissionerProfile');
const defineAvailabilitySlot = require('./availabilitySlot');
const defineDocument = require('./document');
const defineNotification = require('./notification');

const Role = defineRole(sequelize);
const User = defineUser(sequelize);
const Engagement = defineEngagement(sequelize);
const AuditLog = defineAuditLog(sequelize);
const Department = defineDepartment(sequelize);
const Position = definePosition(sequelize);
const CommissionerProfile = defineCommissionerProfile(sequelize);
const AvailabilitySlot = defineAvailabilitySlot(sequelize);
const Document = defineDocument(sequelize);
const Notification = defineNotification(sequelize);

Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

Department.hasMany(User, { foreignKey: 'departmentId' });
User.belongsTo(Department, { foreignKey: 'departmentId' });

Department.hasMany(Position, { foreignKey: 'departmentId' });
Position.belongsTo(Department, { foreignKey: 'departmentId' });

Position.hasMany(User, { foreignKey: 'positionId' });
User.belongsTo(Position, { foreignKey: 'positionId' });

User.hasMany(Engagement, { foreignKey: 'createdBy', as: 'CreatedEngagements' });
Engagement.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });

User.hasMany(Engagement, { foreignKey: 'commissionerId', as: 'CommissionerEngagements' });
Engagement.belongsTo(User, { foreignKey: 'commissionerId', as: 'Commissioner' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(CommissionerProfile, { foreignKey: 'userId' });
CommissionerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AvailabilitySlot, { foreignKey: 'commissionerId', as: 'Availability' });
AvailabilitySlot.belongsTo(User, { foreignKey: 'commissionerId', as: 'Commissioner' });

Engagement.hasMany(Document, { foreignKey: 'engagementId' });
Document.belongsTo(Engagement, { foreignKey: 'engagementId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  Role,
  User,
  Engagement,
  AuditLog,
  Department,
  Position,
  CommissionerProfile,
  AvailabilitySlot,
  Document,
  Notification,
};

