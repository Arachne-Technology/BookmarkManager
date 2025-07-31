-- Add columns to track AI response quality
ALTER TABLE bookmarks 
ADD COLUMN ai_quality_score DECIMAL(3, 2),
ADD COLUMN ai_quality_issues JSONB;

-- Add index for querying by quality score
CREATE INDEX idx_bookmarks_quality_score ON bookmarks(ai_quality_score) WHERE ai_quality_score IS NOT NULL;

-- Add index for quality issues
CREATE INDEX idx_bookmarks_quality_issues ON bookmarks USING GIN(ai_quality_issues) WHERE ai_quality_issues IS NOT NULL;