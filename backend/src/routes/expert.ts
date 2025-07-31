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

    console.log(`[Expert Routes] Raw database result:`, {
      id: bookmark.id,
      title: bookmark.title?.substring(0, 50),
      hasAiRequestData: !!bookmark.ai_request_data,
      hasAiResponseData: !!bookmark.ai_response_data,
      aiRequestDataType: typeof bookmark.ai_request_data,
      aiResponseDataType: typeof bookmark.ai_response_data,
      extractionMethod: bookmark.extraction_method
    });

    // Helper function to safely parse JSON (PostgreSQL may return objects or strings)
    const safeJsonParse = (jsonData: any, fieldName: string) => {
      if (jsonData === null || jsonData === undefined) {
        console.log(`[Expert Routes] Null/undefined ${fieldName}, returning null`);
        return null;
      }
      
      // If it's already an object, return it directly (PostgreSQL JSONB)
      if (typeof jsonData === 'object') {
        return jsonData;
      }
      
      // If it's a string, try to parse it
      if (typeof jsonData === 'string') {
        if (!jsonData.trim()) {
          return null;
        }
        try {
          return JSON.parse(jsonData);
        } catch (error) {
          console.error(`[Expert Routes] Failed to parse ${fieldName}:`, error);
          return null;
        }
      }
      
      console.warn(`[Expert Routes] Unexpected type for ${fieldName}:`, typeof jsonData);
      return null;
    };

    // Parse JSON fields with proper error handling
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
        metadata: safeJsonParse(bookmark.extraction_metadata, 'extraction_metadata') || {},
        extractedContent: bookmark.extracted_content || '',
        contentLength: bookmark.extracted_content ? bookmark.extracted_content.length : 0,
        contentPreview: bookmark.extracted_content ? bookmark.extracted_content.substring(0, 500) + '...' : ''
      },
      aiAnalysis: {
        qualityScore: bookmark.ai_quality_score,
        qualityIssues: safeJsonParse(bookmark.ai_quality_issues, 'ai_quality_issues') || [],
        requestData: safeJsonParse(bookmark.ai_request_data, 'ai_request_data'),
        responseData: safeJsonParse(bookmark.ai_response_data, 'ai_response_data')
      }
    };

    console.log(`[Expert Routes] Final expert data structure:`, {
      hasBookmark: !!expertData.bookmark,
      hasExtraction: !!expertData.extraction,
      hasAiAnalysis: !!expertData.aiAnalysis,
      hasRequestData: !!expertData.aiAnalysis?.requestData,
      hasResponseData: !!expertData.aiAnalysis?.responseData,
      extractionMethod: expertData.extraction?.method
    });
    
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