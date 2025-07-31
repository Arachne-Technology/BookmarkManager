import { Router } from 'express';
import { getDatabase } from '../utils/database';

const router = Router();

/**
 * GET /api/expert/:bookmarkId
 * Fetch expert mode data for a specific bookmark
 */
router.get('/:bookmarkId', async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    console.log(`[Expert Routes] Fetching expert data for bookmark: ${bookmarkId}`);

    const db = getDatabase();
    const result = await db.query(
      `SELECT 
        id,
        title,
        url,
        status,
        ai_provider,
        ai_quality_score,
        ai_quality_issues,
        extracted_content,
        ai_request_data,
        ai_response_data,
        extraction_method,
        extraction_metadata,
        created_at,
        updated_at
      FROM bookmarks 
      WHERE id = $1`,
      [bookmarkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const bookmark = result.rows[0];

    // Parse JSON fields
    const expertData = {
      bookmark: {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        status: bookmark.status,
        aiProvider: bookmark.ai_provider,
        createdAt: bookmark.created_at,
        updatedAt: bookmark.updated_at
      },
      extraction: {
        method: bookmark.extraction_method,
        metadata: bookmark.extraction_metadata && bookmark.extraction_metadata.trim() ? JSON.parse(bookmark.extraction_metadata) : null,
        extractedContent: bookmark.extracted_content,
        contentLength: bookmark.extracted_content ? bookmark.extracted_content.length : 0,
        contentPreview: bookmark.extracted_content ? bookmark.extracted_content.substring(0, 500) + '...' : null
      },
      aiAnalysis: {
        qualityScore: bookmark.ai_quality_score,
        qualityIssues: bookmark.ai_quality_issues && bookmark.ai_quality_issues.trim() ? JSON.parse(bookmark.ai_quality_issues) : [],
        requestData: bookmark.ai_request_data && bookmark.ai_request_data.trim() ? JSON.parse(bookmark.ai_request_data) : null,
        responseData: bookmark.ai_response_data && bookmark.ai_response_data.trim() ? JSON.parse(bookmark.ai_response_data) : null
      }
    };

    console.log(`[Expert Routes] Returning expert data for bookmark: ${bookmarkId}`);
    return res.json(expertData);

  } catch (error) {
    console.error('[Expert Routes] Error fetching expert data:', error);
    return res.status(500).json({ error: 'Failed to fetch expert data' });
  }
});

/**
 * GET /api/expert/:bookmarkId/content
 * Fetch full extracted content for a specific bookmark
 */
router.get('/:bookmarkId/content', async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    console.log(`[Expert Routes] Fetching full content for bookmark: ${bookmarkId}`);

    const db = getDatabase();
    const result = await db.query(
      'SELECT extracted_content FROM bookmarks WHERE id = $1',
      [bookmarkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const extractedContent = result.rows[0].extracted_content;

    return res.json({ 
      content: extractedContent,
      length: extractedContent ? extractedContent.length : 0
    });

  } catch (error) {
    console.error('[Expert Routes] Error fetching content:', error);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

export default router;