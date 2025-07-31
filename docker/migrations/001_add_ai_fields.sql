-- Migration: Add AI-related fields to existing tables
-- This adds support for AI summaries and processing jobs

-- Add AI fields to bookmarks table
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_long_summary TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_tags JSONB;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_category VARCHAR(255);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS screenshot BYTEA;

-- AI processing jobs table
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 1,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User preferences table for AI settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    api_key_encrypted TEXT,
    model VARCHAR(100),
    max_tokens INTEGER,
    temperature DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_ai_jobs_bookmark_id ON ai_jobs(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_provider ON ai_jobs(provider);
CREATE INDEX IF NOT EXISTS idx_user_preferences_session_id ON user_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_ai_provider ON bookmarks(ai_provider);
CREATE INDEX IF NOT EXISTS idx_bookmarks_ai_category ON bookmarks(ai_category);

-- Trigger for user_preferences updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();