import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseBookmarkFile } from '../parsers/bookmarkParser';
import { getDatabase } from '../utils/database';
import { setupLogger } from '../utils/logger';

const router = Router();
const logger = setupLogger();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/html' || file.originalname.endsWith('.html')) {
      cb(null, true);
    } else {
      cb(new Error('Only HTML files are allowed'));
    }
  }
});

router.post('/', upload.single('bookmarkFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const sessionId = uuidv4();
    const db = getDatabase();

    await db.query('BEGIN');

    try {
      const session = await db.query(
        'INSERT INTO sessions (id, file_name, status) VALUES ($1, $2, $3) RETURNING *',
        [sessionId, req.file.originalname, 'processing']
      );

      const bookmarks = await parseBookmarkFile(req.file.path);
      
      for (let i = 0; i < bookmarks.length; i++) {
        const bookmark = bookmarks[i];
        await db.query(
          'INSERT INTO bookmarks (session_id, title, url, folder_path, original_index) VALUES ($1, $2, $3, $4, $5)',
          [sessionId, bookmark.title, bookmark.url, bookmark.folderPath, i]
        );
      }

      await db.query(
        'UPDATE sessions SET original_count = $1, status = $2 WHERE id = $3',
        [bookmarks.length, 'completed', sessionId]
      );

      await db.query('COMMIT');

      logger.info(`Successfully parsed ${bookmarks.length} bookmarks for session ${sessionId}`);

      res.json({
        sessionId,
        message: 'File uploaded and parsed successfully',
        bookmarksCount: bookmarks.length
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

export default router;