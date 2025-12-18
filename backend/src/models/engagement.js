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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
        // Status flow:
        // draft -> scheduled -> approved -> completed
        // Any non-final status can also go to cancelled (with role-specific rules)
        type: DataTypes.ENUM('draft', 'scheduled', 'approved', 'completed', 'cancelled'),
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
      requestingUnitId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Department/Unit that requested this engagement',
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
        { fields: ['requestingUnitId'] },
      ],
    }
  );

