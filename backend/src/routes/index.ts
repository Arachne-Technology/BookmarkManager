import { Express } from 'express';
import uploadRoutes from './upload';
import sessionRoutes from './sessions';
import bookmarkRoutes from './bookmarks';
import exportRoutes from './export';

export function setupRoutes(app: Express) {
  app.use('/api/upload', uploadRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use('/api/export', exportRoutes);
}