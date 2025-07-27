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

-- Create indexes for better performance
CREATE INDEX idx_bookmarks_session_id ON bookmarks(session_id);
CREATE INDEX idx_bookmarks_status ON bookmarks(status);
CREATE INDEX idx_bookmarks_url ON bookmarks(url);
CREATE INDEX idx_user_actions_bookmark_id ON user_actions(bookmark_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

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

-- Insert a sample session for testing
INSERT INTO sessions (id, file_name, original_count, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'sample_bookmarks.html', 0, 'active');