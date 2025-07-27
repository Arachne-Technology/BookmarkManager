import { Router } from 'express';
import { getDatabase } from '../utils/database';
import { setupLogger } from '../utils/logger';

const router = Router();
const logger = setupLogger();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = await db.query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;