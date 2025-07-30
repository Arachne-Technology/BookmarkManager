export interface AIProvider {
  name: string;
  summarize(content: string, url: string, title?: string): Promise<AISummaryResult>;
  assessContentSufficiency(content: string, url: string, title?: string): Promise<ContentSufficiencyResult>;
  isConfigured(): boolean;
  validateConfig(): Promise<boolean>;
}

export interface AISummaryResult {
  shortSummary: string;
  longSummary: string;
  tags?: string[];
  category?: string;
  provider: string;
  confidence: number;
  error?: string;
}

export interface AIProviderConfig {
  provider: 'claude' | 'openai' | 'llama';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProcessingJob {
  id: string;
  bookmarkId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface WebPageContent {
  url: string;
  title: string;
  textContent: string;
  metaDescription?: string;
  screenshot?: Buffer;
  error?: string;
}

export interface ContentSufficiencyResult {
  isSufficient: boolean;
  confidence: number;
  reason: string;
  suggestedAction: 'use_current' | 'fetch_more' | 'metadata_only';
}
