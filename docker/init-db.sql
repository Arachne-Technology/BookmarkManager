-- Initialize BookmarkParser Database
-- This script creates the initial minimal schema for Phase 1

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (temporary user sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '4 hours',
    file_name VARCHAR(255),
    original_count INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active'
);

-- Bookmarks table (parsed bookmark data)
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    title VARCHAR(1000),
    url TEXT NOT NULL,
    folder_path VARCHAR(1000),
    original_index INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    is_accessible BOOLEAN DEFAULT true,
    selected_for_analysis BOOLEAN DEFAULT false,
    ai_summary TEXT,
    ai_long_summary TEXT,
    ai_tags JSONB,
    ai_category VARCHAR(255),
    ai_provider VARCHAR(50),
    screenshot BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User actions table (track user decisions)
CREATE TABLE user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'keep', 'delete', 'categorize'
    new_category VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI processing jobs table
CREATE TABLE ai_jobs (
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
CREATE TABLE user_preferences (
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

-- Create indexes for better performance
CREATE INDEX idx_bookmarks_session_id ON bookmarks(session_id);
CREATE INDEX idx_bookmarks_status ON bookmarks(status);
CREATE INDEX idx_bookmarks_url ON bookmarks(url);
CREATE INDEX idx_bookmarks_ai_provider ON bookmarks(ai_provider);
CREATE INDEX idx_bookmarks_ai_category ON bookmarks(ai_category);
CREATE INDEX idx_user_actions_bookmark_id ON user_actions(bookmark_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_ai_jobs_bookmark_id ON ai_jobs(bookmark_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_provider ON ai_jobs(provider);
CREATE INDEX idx_user_preferences_session_id ON user_preferences(session_id);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_bookmarks_updated_at 
    BEFORE UPDATE ON bookmarks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample session for testing
INSERT INTO sessions (id, file_name, original_count, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'sample_bookmarks.html', 0, 'active');