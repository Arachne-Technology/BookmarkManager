import { Router } from 'express';
import { getDatabase } from '../utils/database';
import { setupLogger } from '../utils/logger';

const router = Router();
const logger = setupLogger();

router.get('/', async (req, res, next) => {
  try {
    const { sessionId, status, limit = '50', offset = '0' } = req.query;
    const db = getDatabase();
    
    let query = 'SELECT * FROM bookmarks WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;
    
    if (sessionId) {
      query += ` AND session_id = $${++paramCount}`;
      params.push(sessionId);
    }
    
    if (status) {
      query += ` AND status = $${++paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY original_index ASC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    res.json({
      bookmarks: result.rows,
      total: result.rowCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, selected_for_analysis } = req.body;
    const db = getDatabase();
    
    const result = await db.query(
      'UPDATE bookmarks SET status = COALESCE($1, status), selected_for_analysis = COALESCE($2, selected_for_analysis), updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, selected_for_analysis, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;