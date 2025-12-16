const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Engagement',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referenceNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      purpose: {
        type: DataTypes.STRING(300),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      commissionerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'engagements',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['referenceNo'], unique: true },
        { fields: ['commissionerId'] },
        { fields: ['status'] },
        { fields: ['date'] },
      ],
    }
  );

