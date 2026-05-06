-- Add 'admin' value to user_role enum
-- Must be run after 001_initial_schema.sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
