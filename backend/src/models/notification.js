const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of notification (engagement_created, engagement_assigned, etc.)',
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON metadata for the notification',
        get() {
          const value = this.getDataValue('metadata');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('metadata', value ? JSON.stringify(value) : null);
        },
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['isRead'] },
        { fields: ['type'] },
        { fields: ['createdAt'] },
      ],
    }
  );

