import { Router } from 'express';
import { qualityService } from '../services/qualityService';

const router = Router();

// Get quality report for current session or overall
router.get('/report', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const report = await qualityService.getQualityReport(sessionId);
    return res.json(report);
  } catch (error) {
    console.error('Error getting quality report:', error);
    return res.status(500).json({ error: 'Failed to get quality report' });
  }
});

// Get low-quality bookmarks that might need reprocessing
router.get('/low-quality', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const bookmarks = await qualityService.getLowQualityBookmarks(sessionId, limit);
    return res.json(bookmarks);
  } catch (error) {
    console.error('Error getting low-quality bookmarks:', error);
    return res.status(500).json({ error: 'Failed to get low-quality bookmarks' });
  }
});

// Mark bookmarks for reprocessing
router.post('/reprocess', async (req, res) => {
  try {
    const { bookmarkIds, reason } = req.body;
    
    if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
      return res.status(400).json({ error: 'bookmarkIds array is required' });
    }

    const count = await qualityService.markForReprocessing(bookmarkIds, reason);
    return res.json({ 
      success: true, 
      message: `Marked ${count} bookmarks for reprocessing`,
      count 
    });
  } catch (error) {
    console.error('Error marking bookmarks for reprocessing:', error);
    return res.status(500).json({ error: 'Failed to mark bookmarks for reprocessing' });
  }
});

// Get quality trends over time
router.get('/trends', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const days = parseInt(req.query.days as string) || 7;
    const trends = await qualityService.getQualityTrends(sessionId, days);
    return res.json(trends);
  } catch (error) {
    console.error('Error getting quality trends:', error);
    return res.status(500).json({ error: 'Failed to get quality trends' });
  }
});

export default router;