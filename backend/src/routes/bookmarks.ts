import { Router } from 'express';
import { getDatabase } from '../utils/database';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { sessionId, status, limit, offset = '0' } = req.query;
    const db = getDatabase();

    let countQuery = 'SELECT COUNT(*) FROM bookmarks WHERE 1=1';
    let dataQuery = 'SELECT * FROM bookmarks WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (sessionId) {
      countQuery += ` AND session_id = $${++paramCount}`;
      dataQuery += ` AND session_id = $${paramCount}`;
      params.push(sessionId);
    }

    if (status) {
      countQuery += ` AND status = $${++paramCount}`;
      dataQuery += ` AND status = $${paramCount}`;
      params.push(status);
    }

    dataQuery += ` ORDER BY original_index ASC`;
    const dataParams = [...params];

    // Only apply pagination if limit is explicitly provided and greater than 0
    if (limit && parseInt(limit as string) > 0) {
      dataQuery += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      dataParams.push(limit, offset);
    }

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params),
      db.query(dataQuery, dataParams),
    ]);

    res.json({
      bookmarks: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: limit ? parseInt(limit as string) : null,
      offset: parseInt(offset as string),
    });
    return;
  } catch (error) {
    next(error);
    return;
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
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
