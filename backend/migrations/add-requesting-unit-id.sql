-- Migration: Add requestingUnitId column to engagements table
-- Run this SQL script directly in your MySQL database if the migration script doesn't work

-- Check if column exists (optional - MySQL will error if column already exists)
-- You can skip this if you're sure the column doesn't exist

-- Add the column
ALTER TABLE engagements 
ADD COLUMN requestingUnitId CHAR(36) NULL 
COMMENT 'Department/Unit that requested this engagement' 
AFTER createdBy;

-- Add index for performance
CREATE INDEX idx_engagements_requestingUnitId ON engagements(requestingUnitId);

