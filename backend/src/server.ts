// Import required dependencies for the Express.js server
import express from 'express';
import cors from 'cors'; // Enable Cross-Origin Resource Sharing for frontend communication
import helmet from 'helmet'; // Security middleware to protect against common vulnerabilities
import dotenv from 'dotenv'; // Load environment variables from .env file
import { setupDatabase } from './utils/database';
import { setupLogger } from './utils/logger';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables from .env file into process.env
dotenv.config();

// Create Express application instance
const app = express();
// Set server port from environment variable or default to 3001
const PORT = process.env.PORT || 3001;
// Initialize logger for application-wide logging
const logger = setupLogger();

// Apply security headers to protect against XSS, clickjacking, etc.
app.use(helmet());

// Enable CORS to allow requests from the frontend React application
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow requests from frontend URL
  credentials: true // Allow cookies and authentication headers
}));

// Parse JSON request bodies with size limit for file uploads
app.use(express.json({ limit: process.env.UPLOAD_LIMIT || '10mb' }));
// Parse URL-encoded form data (extended: true allows for nested objects)
app.use(express.urlencoded({ extended: true, limit: process.env.UPLOAD_LIMIT || '10mb' }));

// Health check endpoint for monitoring and load balancers
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'bookmark-parser-backend'
  });
});

// Register all application routes (bookmarks, upload, export, etc.)
setupRoutes(app);

// Global error handler middleware - must be last in the middleware chain
app.use(errorHandler);

/**
 * Starts the Express server after initializing database connections
 * This function handles the server startup sequence and error handling
 */
async function startServer() {
  try {
    // Initialize database connection before starting the server
    await setupDatabase();
    logger.info('Database connection established');
    
    // Start the HTTP server on the specified port
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    // Log startup errors and exit the process if server can't start
    logger.error('Failed to start server:', error);
    process.exit(1); // Exit with error code 1 to indicate failure
  }
}

// Initialize and start the server
startServer();