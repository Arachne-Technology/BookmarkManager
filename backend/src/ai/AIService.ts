import { AIProvider, AIProviderConfig, AIProcessingJob } from './types';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { WebScraperService } from './WebScraperService';
import { getDatabase } from '../utils/database';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private webScraper: WebScraperService;
  private processingQueue: AIProcessingJob[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.webScraper = new WebScraperService();
    this.loadProviders();
  }

  private loadProviders(): void {
    // Load providers from environment variables
    if (process.env.CLAUDE_API_KEY) {
      const claudeConfig: AIProviderConfig = {
        provider: 'claude',
        apiKey: process.env.CLAUDE_API_KEY,
        model: 'claude-3-5-haiku-20241022'
      };
      this.providers.set('claude', new ClaudeProvider(claudeConfig));
    }

    if (process.env.OPENAI_API_KEY) {
      const openaiConfig: AIProviderConfig = {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo'
      };
      this.providers.set('openai', new OpenAIProvider(openaiConfig));
    }
  }

  async configureProvider(config: AIProviderConfig): Promise<boolean> {
    try {
      let provider: AIProvider;
      
      switch (config.provider) {
        case 'claude':
          provider = new ClaudeProvider(config);
          break;
        case 'openai':
          provider = new OpenAIProvider(config);
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }

      const isValid = await provider.validateConfig();
      if (isValid) {
        this.providers.set(config.provider, provider);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error configuring provider:', error);
      return false;
    }
  }

  getConfiguredProviders(): string[] {
    return Array.from(this.providers.keys()).filter(key => 
      this.providers.get(key)?.isConfigured()
    );
  }

  async validateProvider(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) return false;
    return await provider.validateConfig();
  }

  async processBookmark(bookmarkId: string, providerName?: string): Promise<string> {
    const db = getDatabase();
    
    try {
      // Get bookmark details
      const bookmarkResult = await db.query(
        'SELECT * FROM bookmarks WHERE id = $1',
        [bookmarkId]
      );

      if (bookmarkResult.rows.length === 0) {
        throw new Error('Bookmark not found');
      }
      
      // Determine which provider to use
      const selectedProvider = providerName || this.getDefaultProvider();
      if (!selectedProvider) {
        throw new Error('No AI provider configured');
      }

      // Create processing job
      const jobId = await this.createProcessingJob(bookmarkId, selectedProvider);
      
      // Add to queue
      this.addToQueue({
        id: jobId,
        bookmarkId,
        status: 'pending',
        provider: selectedProvider,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date()
      });

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      return jobId;
    } catch (error) {
      console.error('Error processing bookmark:', error);
      throw error;
    }
  }

  private getDefaultProvider(): string | null {
    const configuredProviders = this.getConfiguredProviders();
    
    // Priority order: claude, openai
    const priorities = ['claude', 'openai'];
    for (const provider of priorities) {
      if (configuredProviders.includes(provider)) {
        return provider;
      }
    }
    
    return configuredProviders[0] || null;
  }

  private async createProcessingJob(bookmarkId: string, provider: string): Promise<string> {
    const db = getDatabase();
    
    const result = await db.query(
      `INSERT INTO ai_jobs (bookmark_id, provider, status, created_at) 
       VALUES ($1, $2, 'pending', NOW()) 
       RETURNING id`,
      [bookmarkId, provider]
    );
    
    return result.rows[0].id;
  }

  private addToQueue(job: AIProcessingJob): void {
    this.processingQueue.push(job);
    this.processingQueue.sort((a, b) => b.priority - a.priority);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const job = this.processingQueue.shift()!;
      await this.processJob(job);
      
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  }

  private async processJob(job: AIProcessingJob): Promise<void> {
    const db = getDatabase();
    
    try {
      // Update job status
      await db.query(
        'UPDATE ai_jobs SET status = $1, started_at = NOW() WHERE id = $2',
        ['processing', job.id]
      );

      // Get bookmark
      const bookmarkResult = await db.query(
        'SELECT * FROM bookmarks WHERE id = $1',
        [job.bookmarkId]
      );

      if (bookmarkResult.rows.length === 0) {
        throw new Error('Bookmark not found');
      }

      const bookmark = bookmarkResult.rows[0];
      
      // Scrape content
      const content = await this.webScraper.scrapeContent(bookmark.url);
      
      if (content.error) {
        throw new Error(`Scraping failed: ${content.error}`);
      }

      // Get AI provider
      const provider = this.providers.get(job.provider);
      if (!provider) {
        throw new Error(`Provider ${job.provider} not available`);
      }

      // Generate summary
      const summary = await provider.summarize(
        content.textContent, 
        bookmark.url, 
        bookmark.title
      );

      if (summary.error) {
        throw new Error(`AI processing failed: ${summary.error}`);
      }

      // Update bookmark with summary
      await db.query(
        `UPDATE bookmarks SET 
         ai_summary = $1, 
         ai_long_summary = $2, 
         ai_tags = $3, 
         ai_category = $4, 
         ai_provider = $5,
         updated_at = NOW() 
         WHERE id = $6`,
        [
          summary.shortSummary,
          summary.longSummary,
          JSON.stringify(summary.tags || []),
          summary.category,
          job.provider,
          job.bookmarkId
        ]
      );

      // Mark job as completed
      await db.query(
        'UPDATE ai_jobs SET status = $1, completed_at = NOW() WHERE id = $2',
        ['completed', job.id]
      );

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      // Update job with error
      await db.query(
        `UPDATE ai_jobs SET 
         status = $1, 
         error = $2, 
         attempts = attempts + 1 
         WHERE id = $3`,
        ['failed', error instanceof Error ? error.message : 'Unknown error', job.id]
      );

      // Retry if attempts < maxAttempts
      if (job.attempts < job.maxAttempts - 1) {
        setTimeout(() => {
          job.attempts++;
          job.status = 'pending';
          this.addToQueue(job);
        }, 5000); // Retry after 5 seconds
      }
    }
  }

  async getJobStatus(jobId: string): Promise<AIProcessingJob | null> {
    const db = getDatabase();
    
    const result = await db.query(
      'SELECT * FROM ai_jobs WHERE id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async cleanup(): Promise<void> {
    await this.webScraper.close();
  }
}

// Singleton instance
export const aiService = new AIService();