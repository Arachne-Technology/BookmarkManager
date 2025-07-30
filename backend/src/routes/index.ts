import type { Express } from 'express';
import aiRoutes from './ai';
import bookmarkRoutes from './bookmarks';
import exportRoutes from './export';
import sessionRoutes from './sessions';
import settingsRoutes from './settings';
import uploadRoutes from './upload';

export function setupRoutes(app: Express) {
  app.use('/api/upload', uploadRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/bookmarks', bookmarkRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/settings', settingsRoutes);
}
