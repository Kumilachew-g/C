/**
 * Migration: Add requestingUnitId column to engagements table
 * Run this script to add the requestingUnitId column to existing engagements table
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const addRequestingUnitIdColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Check if column already exists
    const results = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'engagements' 
       AND COLUMN_NAME = 'requestingUnitId'`,
      { type: QueryTypes.SELECT }
    );

    if (results && results.length > 0) {
      console.log('Column requestingUnitId already exists. Skipping migration.');
      await sequelize.close();
      return;
    }

    // Add the column
    await sequelize.query(
      `ALTER TABLE engagements 
       ADD COLUMN requestingUnitId CHAR(36) NULL 
       COMMENT 'Department/Unit that requested this engagement' 
       AFTER createdBy`,
      { type: QueryTypes.RAW }
    );

    // Add index for performance
    await sequelize.query(
      `CREATE INDEX idx_engagements_requestingUnitId ON engagements(requestingUnitId)`,
      { type: QueryTypes.RAW }
    );

    console.log('Successfully added requestingUnitId column to engagements table');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
};

addRequestingUnitIdColumn();

