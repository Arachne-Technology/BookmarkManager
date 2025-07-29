import { Router } from 'express';
import { aiService } from '../ai/AIService';
import { getDatabase } from '../utils/database';

const router = Router();

// Get configured AI providers
router.get('/providers', async (_req, res, next) => {
  try {
    const providers = aiService.getConfiguredProviders();
    res.json({ providers });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Validate a specific provider
router.post('/providers/:provider/validate', async (req, res, next) => {
  try {
    const { provider } = req.params;
    const isValid = await aiService.validateProvider(provider);
    res.json({ isValid });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Configure a provider
router.post('/providers/configure', async (req, res, next) => {
  try {
    const config = req.body;
    const success = await aiService.configureProvider(config);
    res.json({ success });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Process selected bookmarks with AI
router.post('/process', async (req, res, next) => {
  try {
    const { bookmarkIds, provider } = req.body;
    
    if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
      return res.status(400).json({ error: 'bookmarkIds must be a non-empty array' });
    }

    const jobIds = [];
    for (const bookmarkId of bookmarkIds) {
      const jobId = await aiService.processBookmark(bookmarkId, provider);
      jobIds.push(jobId);
    }

    res.json({ jobIds, message: `Started processing ${bookmarkIds.length} bookmarks` });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Get job status
router.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await aiService.getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Get processing queue status
router.get('/queue', async (_req, res, next) => {
  try {
    const db = getDatabase();
    
    const result = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM ai_jobs 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);

    const stats = result.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    res.json(stats);
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Get bookmarks with AI summaries
router.get('/summaries/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const db = getDatabase();
    
    const result = await db.query(`
      SELECT 
        id,
        title,
        url,
        ai_summary,
        ai_long_summary,
        ai_tags,
        ai_category,
        ai_provider
      FROM bookmarks 
      WHERE session_id = $1 
        AND ai_summary IS NOT NULL
      ORDER BY updated_at DESC
    `, [sessionId]);

    const bookmarks = result.rows.map(row => ({
      ...row,
      ai_tags: row.ai_tags || []
    }));

    res.json({ bookmarks });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export default router;