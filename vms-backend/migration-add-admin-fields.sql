-- Migration script to add new fields to Admins table
-- Run this in your PostgreSQL database

-- Add new columns to Admins table
ALTER TABLE "Admins" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);
ALTER TABLE "Admins" ADD COLUMN IF NOT EXISTS "pinHash" VARCHAR(255);
ALTER TABLE "Admins" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Update existing admin records to have isActive = true
UPDATE "Admins" SET "isActive" = true WHERE "isActive" IS NULL;

-- Add a PIN for the existing dummy admin (password123)
-- This will be hashed by the model hook when we update it
UPDATE "Admins" SET "pinHash" = 'password123' WHERE "email" = 'admin@test.local';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Admins' 
ORDER BY ordinal_position;
