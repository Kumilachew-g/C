const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Document',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      engagementId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      filePath: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fileType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: 'documents',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['engagementId'] },
        { fields: ['fileType'] },
      ],
    }
  );

