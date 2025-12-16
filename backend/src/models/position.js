const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Position',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'positions',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['departmentId'] },
        { fields: ['name', 'departmentId'], unique: true },
      ],
    }
  );

