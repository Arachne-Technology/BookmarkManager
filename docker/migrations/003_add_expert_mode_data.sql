-- Migration: Add expert mode data for detailed analysis
-- This adds storage for extracted content and AI interaction details

-- Add expert mode columns to bookmarks table
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS extracted_content TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_request_data JSONB;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS ai_response_data JSONB;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(100);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS extraction_metadata JSONB;

-- Add indexes for expert mode queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_extraction_method ON bookmarks(extraction_method) WHERE extraction_method IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookmarks_expert_data ON bookmarks USING GIN(extraction_metadata) WHERE extraction_metadata IS NOT NULL;