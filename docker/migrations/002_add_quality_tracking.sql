-- Migration: Add quality tracking fields for AI responses
-- This adds support for tracking AI response quality and issues

-- Add quality tracking columns to bookmarks table
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_quality_score DECIMAL(3, 2);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_quality_issues JSONB;

-- Add indexes for quality tracking
CREATE INDEX IF NOT EXISTS idx_bookmarks_quality_score ON bookmarks(ai_quality_score) WHERE ai_quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookmarks_quality_issues ON bookmarks USING GIN(ai_quality_issues) WHERE ai_quality_issues IS NOT NULL;