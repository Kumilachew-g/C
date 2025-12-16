const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'CommissionerProfile',
    {
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      office: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
    },
    {
      tableName: 'commissioner_profiles',
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['userId'], unique: true }],
    }
  );

