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
  qualityScore?: number;
  qualityIssues?: string[];
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
  // Expert mode metadata
  extractionMethod?: string;
  originalSize?: number;
  extractionTime?: number;
  attempts?: number;
  failedMethods?: string[];
}

export interface ContentSufficiencyResult {
  isSufficient: boolean;
  confidence: number;
  reason: string;
  suggestedAction: 'use_current' | 'fetch_more' | 'metadata_only';
}

export interface ResponseQualityAssessment {
  isHighQuality: boolean;
  qualityScore: number; // 0-1 scale
  issues: ResponseQualityIssue[];
  suggestedAction: 'accept' | 'retry_different_scraping' | 'use_metadata_only' | 'mark_as_failed';
  confidence: number;
}

export interface ResponseQualityIssue {
  type: 'insufficient_content' | 'generic_response' | 'error_acknowledgment' | 'incomplete_analysis' | 'low_confidence' | 'content_blocked';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix?: string;
}
