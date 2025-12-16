const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'AvailabilitySlot',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commissionerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'availability_slots',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['commissionerId'] },
        { fields: ['startTime'] },
        { fields: ['endTime'] },
      ],
    }
  );

