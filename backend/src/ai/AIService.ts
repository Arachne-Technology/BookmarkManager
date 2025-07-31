import { getDatabase } from '../utils/database';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import type { AIProcessingJob, AIProvider, AIProviderConfig } from './types';
import { ProgressiveWebScraperService } from './ProgressiveWebScraperService';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private webScraper: ProgressiveWebScraperService;
  private processingQueue: AIProcessingJob[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.webScraper = new ProgressiveWebScraperService();
    this.loadProviders();
  }

  private loadProviders(): void {
    console.log('[AI Service] Loading providers from environment variables...');
    console.log('[AI Service] CLAUDE_API_KEY present:', !!process.env.CLAUDE_API_KEY);
    console.log('[AI Service] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    
    // Load providers from environment variables
    if (process.env.CLAUDE_API_KEY) {
      const claudeConfig: AIProviderConfig = {
        provider: 'claude',
        apiKey: process.env.CLAUDE_API_KEY,
        model: 'claude-3-5-haiku-20241022',
      };
      this.providers.set('claude', new ClaudeProvider(claudeConfig));
      console.log('[AI Service] Claude provider loaded');
    } else {
      console.log('[AI Service] Claude API key not found in environment');
    }

    if (process.env.OPENAI_API_KEY) {
      const openaiConfig: AIProviderConfig = {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
      };
      this.providers.set('openai', new OpenAIProvider(openaiConfig));
      console.log('[AI Service] OpenAI provider loaded');
    } else {
      console.log('[AI Service] OpenAI API key not found in environment');
    }
    
    console.log('[AI Service] Total providers loaded:', this.providers.size);
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
    return Array.from(this.providers.keys()).filter((key) =>
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
      console.log(`[AI Service] processBookmark called with bookmarkId: ${bookmarkId}, providerName: ${providerName}`);
      
      // Get bookmark details
      const bookmarkResult = await db.query('SELECT * FROM bookmarks WHERE id = $1', [bookmarkId]);

      if (bookmarkResult.rows.length === 0) {
        throw new Error('Bookmark not found');
      }

      const bookmark = bookmarkResult.rows[0];
      console.log(`[AI Service] Found bookmark: ${bookmark.title} (${bookmark.url})`);

      // Determine which provider to use
      const selectedProvider = providerName || this.getDefaultProvider();
      console.log(`[AI Service] Selected provider: ${selectedProvider}`);
      console.log(`[AI Service] Available providers:`, this.getConfiguredProviders());
      
      if (!selectedProvider) {
        console.error('[AI Service] No AI provider configured! Available providers:', Array.from(this.providers.keys()));
        throw new Error('No AI provider configured');
      }

      // Create processing job
      const jobId = await this.createProcessingJob(bookmarkId, selectedProvider);
      console.log(`[AI Service] Created processing job: ${jobId}`);

      // Add to queue
      this.addToQueue({
        id: jobId,
        bookmarkId,
        status: 'pending',
        provider: selectedProvider,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      });

      console.log(`[AI Service] Added job to queue. Queue length: ${this.processingQueue.length}`);

      // Start processing if not already running
      if (!this.isProcessing) {
        console.log(`[AI Service] Starting queue processing...`);
        this.processQueue();
      } else {
        console.log(`[AI Service] Queue already processing`);
      }

      return jobId;
    } catch (error) {
      console.error('[AI Service] Error processing bookmark:', error);
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  }

  private async processJob(job: AIProcessingJob): Promise<void> {
    const db = getDatabase();

    try {
      console.log(`[AI Service] Starting job ${job.id} for bookmark ${job.bookmarkId} using provider ${job.provider}`);
      
      // Update job status
      await db.query('UPDATE ai_jobs SET status = $1, started_at = NOW() WHERE id = $2', [
        'processing',
        job.id,
      ]);

      // Get bookmark
      const bookmarkResult = await db.query('SELECT * FROM bookmarks WHERE id = $1', [
        job.bookmarkId,
      ]);

      if (bookmarkResult.rows.length === 0) {
        throw new Error('Bookmark not found');
      }

      const bookmark = bookmarkResult.rows[0];
      console.log(`[AI Service] Processing bookmark: ${bookmark.title} (${bookmark.url})`);

      // Scrape content
      console.log(`[AI Service] Starting content scraping for ${bookmark.url}`);
      const content = await this.webScraper.scrapeContent(bookmark.url);

      if (content.error) {
        throw new Error(`Scraping failed: ${content.error}`);
      }

      console.log(`[AI Service] Content extracted: ${content.title}, ${content.textContent.length} characters`);

      // Get AI provider
      const provider = this.providers.get(job.provider);
      if (!provider) {
        console.error(`[AI Service] Provider ${job.provider} not available. Available providers:`, Array.from(this.providers.keys()));
        throw new Error(`Provider ${job.provider} not available`);
      }

      console.log(`[AI Service] Using AI provider: ${provider.name}, configured: ${provider.isConfigured()}`);

      // Generate summary
      console.log(`[AI Service] Calling AI provider to summarize content...`);
      const summary = await provider.summarize(content.textContent, bookmark.url, bookmark.title);

      console.log(`[AI Service] AI provider response:`, {
        hasError: !!summary.error,
        shortSummary: summary.shortSummary ? `${summary.shortSummary.substring(0, 50)}...` : 'none',
        longSummary: summary.longSummary ? `${summary.longSummary.substring(0, 100)}...` : 'none',
        tags: summary.tags,
        category: summary.category,
        provider: summary.provider,
        qualityScore: summary.qualityScore,
        qualityIssues: summary.qualityIssues
      });

      if (summary.error) {
        throw new Error(`AI processing failed: ${summary.error}`);
      }

      // Check response quality and handle accordingly
      if (summary.qualityScore !== undefined && summary.qualityScore < 0.7) {
        console.log(`[AI Service] Low quality response detected (score: ${summary.qualityScore}). Issues:`, summary.qualityIssues);
        
        // For very low quality responses (< 0.3), still proceed but mark as low quality
        if (summary.qualityScore < 0.3) {
          console.warn(`[AI Service] Very low quality response (score: ${summary.qualityScore}), but proceeding with processing. Issues: ${summary.qualityIssues?.join(', ')}`);
          // We'll still save the response but the quality score and issues will reflect the problems
        } else {
          // For medium quality issues, we can proceed but log a warning
          console.warn(`[AI Service] Proceeding with medium-quality response (score: ${summary.qualityScore})`);
        }
      }

      // Update bookmark with summary
      console.log(`[AI Service] Updating bookmark ${job.bookmarkId} with AI results...`);
      console.log(`[AI Service] Update parameters:`, {
        shortSummary: summary.shortSummary ? `${summary.shortSummary.substring(0, 50)}...` : 'null',
        longSummary: summary.longSummary ? `${summary.longSummary.substring(0, 50)}...` : 'null',
        tags: summary.tags,
        category: summary.category,
        provider: job.provider,
        bookmarkId: job.bookmarkId
      });
      
      // Prepare expert mode data
      const aiRequestData = {
        provider: job.provider,
        timestamp: new Date().toISOString(),
        url: bookmark.url,
        title: bookmark.title,
        contentLength: content.textContent.length,
        prompt: 'summarize_content' // Could be expanded to include actual prompt
      };

      const aiResponseData = {
        ...summary,
        timestamp: new Date().toISOString(),
        processingTimeMs: job.startedAt ? Date.now() - new Date(job.startedAt).getTime() : undefined
      };

      const extractionMetadata = {
        originalFileSize: content.originalSize || null,
        extractedLength: content.textContent.length,
        extractionTime: content.extractionTime || null,
        attempts: content.attempts || null,
        failedMethods: content.failedMethods || []
      };

      const updateResult = await db.query(
        `UPDATE bookmarks SET 
         ai_summary = $1, 
         ai_long_summary = $2, 
         ai_tags = $3, 
         ai_category = $4, 
         ai_provider = $5,
         ai_quality_score = $6,
         ai_quality_issues = $7,
         extracted_content = $8,
         ai_request_data = $9,
         ai_response_data = $10,
         extraction_method = $11,
         extraction_metadata = $12,
         status = 'ai_analyzed',
         updated_at = NOW() 
         WHERE id = $13 
         RETURNING id, status, ai_summary`,
        [
          summary.shortSummary || null,
          summary.longSummary || null,
          JSON.stringify(summary.tags || []),
          summary.category || null,
          job.provider,
          summary.qualityScore || null,
          JSON.stringify(summary.qualityIssues || []),
          content.textContent || null, // Store extracted content
          JSON.stringify(aiRequestData),
          JSON.stringify(aiResponseData),
          content.extractionMethod || 'unknown',
          JSON.stringify(extractionMetadata),
          job.bookmarkId,
        ]
      );

      console.log(`[AI Service] Database update result:`, updateResult.rows[0]);
      
      if (updateResult.rows.length === 0) {
        throw new Error(`Failed to update bookmark ${job.bookmarkId} - bookmark not found or update failed`);
      }
      
      if (updateResult.rows[0].status !== 'ai_analyzed') {
        console.error(`[AI Service] WARNING: Status update failed! Expected 'ai_analyzed', got '${updateResult.rows[0].status}'`);
        throw new Error(`Status update failed for bookmark ${job.bookmarkId}`);
      }

      // Mark job as completed
      console.log(`[AI Service] Marking job ${job.id} as completed...`);
      await db.query('UPDATE ai_jobs SET status = $1, completed_at = NOW() WHERE id = $2', [
        'completed',
        job.id,
      ]);

      console.log(`[AI Service] Job ${job.id} completed successfully!`);
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

    const result = await db.query('SELECT * FROM ai_jobs WHERE id = $1', [jobId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for SimpleWebScraperService
  }
}

// Singleton instance
export const aiService = new AIService();
