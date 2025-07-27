import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupDatabase } from './utils/database';
import { setupLogger } from './utils/logger';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const logger = setupLogger();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: process.env.UPLOAD_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.UPLOAD_LIMIT || '10mb' }));

app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'bookmark-parser-backend'
  });
});

setupRoutes(app);

app.use(errorHandler);

async function startServer() {
  try {
    await setupDatabase();
    logger.info('Database connection established');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();