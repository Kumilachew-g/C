const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'departments',
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['name'], unique: true }],
    }
  );

