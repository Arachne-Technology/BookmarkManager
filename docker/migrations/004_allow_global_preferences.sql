-- Migration: Allow global user preferences
-- This migration modifies the user_preferences table to support global preferences
-- that are not tied to a specific session

-- Remove the foreign key constraint on session_id
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_session_id_fkey;

-- Change the session_id column type from UUID to TEXT to allow 'global'
ALTER TABLE user_preferences ALTER COLUMN session_id TYPE TEXT;

-- Allow session_id to be nullable 
ALTER TABLE user_preferences ALTER COLUMN session_id DROP NOT NULL;

-- Add a check constraint to ensure session_id is either a UUID format or 'global'
ALTER TABLE user_preferences ADD CONSTRAINT session_id_check 
    CHECK (session_id IS NULL OR session_id = 'global' OR 
           session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Create a unique constraint to ensure only one global preference record per provider
CREATE UNIQUE INDEX idx_user_preferences_global 
    ON user_preferences (provider) 
    WHERE session_id = 'global' OR session_id IS NULL;

-- Update the existing index to handle nullable session_id
DROP INDEX IF EXISTS idx_user_preferences_session_id;
CREATE INDEX idx_user_preferences_session_id ON user_preferences(session_id) 
    WHERE session_id IS NOT NULL AND session_id != 'global';