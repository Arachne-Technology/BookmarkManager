// Import dependencies for file upload handling and database operations
import { Router } from 'express';
import multer from 'multer'; // Middleware for handling multipart/form-data (file uploads)
import path from 'path'; // Node.js path utilities for file extensions
import { v4 as uuidv4 } from 'uuid'; // Generate unique session identifiers
import { parseBookmarkFile } from '../parsers/bookmarkParser';
import { getDatabase } from '../utils/database';
import { setupLogger } from '../utils/logger';

// Create Express router for upload-related routes
const router = Router();
const logger = setupLogger();

/**
 * Configure multer disk storage for uploaded bookmark files
 * Files are stored temporarily in the uploads/ directory during processing
 */
const storage = multer.diskStorage({
  // Set destination directory for uploaded files
  destination: (_, __, cb) => {
    cb(null, 'uploads/'); // Store files in uploads/ directory
  },
  // Generate unique filename to prevent conflicts
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Format: fieldname-timestamp-random.ext (e.g., bookmarkFile-1234567890-123456789.html)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * Configure multer middleware with storage, size limits, and file validation
 * This ensures only valid HTML bookmark files are accepted
 */
const upload = multer({
  storage, // Use the disk storage configuration defined above
  limits: {
    fileSize: 10 * 1024 * 1024 // Maximum file size: 10MB (sufficient for large bookmark exports)
  },
  // Validate uploaded files to ensure they are HTML bookmark exports
  fileFilter: (_, file, cb) => {
    // Accept files with HTML MIME type or .html extension
    if (file.mimetype === 'text/html' || file.originalname.endsWith('.html')) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only HTML files are allowed')); // Reject non-HTML files
    }
  }
});

/**
 * POST route handler for uploading and parsing bookmark files
 * Creates a new session and stores parsed bookmarks in the database
 * 
 * Expected: multipart/form-data with 'bookmarkFile' field containing HTML file
 * Returns: { sessionId, message, bookmarksCount }
 */
router.post('/', upload.single('bookmarkFile'), async (req, res, next) => {
  try {
    // Validate that a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique session ID for this upload
    const sessionId = uuidv4();
    const db = getDatabase();

    // Start database transaction to ensure data consistency
    await db.query('BEGIN');

    try {
      // Create session record to track this upload
      await db.query(
        'INSERT INTO sessions (id, file_name, status) VALUES ($1, $2, $3) RETURNING *',
        [sessionId, req.file.originalname, 'processing']
      );

      // Parse the uploaded HTML bookmark file
      const bookmarks = await parseBookmarkFile(req.file.path);
      
      // Insert each parsed bookmark into the database
      for (let i = 0; i < bookmarks.length; i++) {
        const bookmark = bookmarks[i]!;
        await db.query(
          'INSERT INTO bookmarks (session_id, title, url, folder_path, original_index) VALUES ($1, $2, $3, $4, $5)',
          [sessionId, bookmark.title, bookmark.url, bookmark.folderPath, i]
        );
      }

      // Update session with final bookmark count and mark as completed
      await db.query(
        'UPDATE sessions SET original_count = $1, status = $2 WHERE id = $3',
        [bookmarks.length, 'completed', sessionId]
      );

      // Commit transaction if all operations succeeded
      await db.query('COMMIT');

      logger.info(`Successfully parsed ${bookmarks.length} bookmarks for session ${sessionId}`);

      // Return success response with session details
      res.json({
        sessionId,
        message: 'File uploaded and parsed successfully',
        bookmarksCount: bookmarks.length
      });
      return;

    } catch (error) {
      // Rollback transaction if any database operation failed
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    // Pass errors to the global error handler middleware
    next(error);
    return;
  }
});

// Export the configured router for use in the main application
export default router;