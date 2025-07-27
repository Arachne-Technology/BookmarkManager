import { Router } from 'express';
import { getDatabase } from '../utils/database';
import { generateBookmarkHTML } from '../services/exportService';
import { setupLogger } from '../utils/logger';

const router = Router();
const logger = setupLogger();

router.post('/', async (req, res, next) => {
  try {
    const { sessionId, filters } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const db = getDatabase();
    
    let query = 'SELECT * FROM bookmarks WHERE session_id = $1';
    const params: any[] = [sessionId];
    let paramCount = 1;
    
    if (filters?.status && filters.status !== 'all') {
      query += ` AND status = $${++paramCount}`;
      params.push(filters.status);
    }
    
    if (filters?.includeDeleted === false) {
      query += ` AND status != 'deleted'`;
    }
    
    query += ' ORDER BY folder_path ASC, original_index ASC';
    
    const result = await db.query(query, params);
    const bookmarks = result.rows;
    
    if (bookmarks.length === 0) {
      return res.status(404).json({ error: 'No bookmarks found for export' });
    }
    
    const html = generateBookmarkHTML(bookmarks);
    
    const session = await db.query(
      'SELECT file_name FROM sessions WHERE id = $1',
      [sessionId]
    );
    
    const originalFileName = session.rows[0]?.file_name || 'bookmarks.html';
    const exportFileName = originalFileName.replace('.html', '_cleaned.html');
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFileName}"`);
    res.send(html);
    
    logger.info(`Exported ${bookmarks.length} bookmarks for session ${sessionId}`);
    
  } catch (error) {
    next(error);
  }
});

export default router;