import { Router } from 'express';
import { getDatabase } from '../utils/database';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
