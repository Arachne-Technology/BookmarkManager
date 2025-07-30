import type { AIProvider, AIProviderConfig, AISummaryResult } from './types';

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract get name(): string;
  abstract summarize(content: string, url: string, title?: string): Promise<AISummaryResult>;
  abstract isConfigured(): boolean;
  abstract validateConfig(): Promise<boolean>;

  protected createPrompt(content: string, url: string, title?: string): string {
    return `Please analyze the following web page content and provide:
1. A one-line summary (max 150 characters)
2. A detailed summary (2-3 paragraphs)
3. Up to 5 relevant tags
4. A category classification

URL: ${url}
Title: ${title || 'No title'}

Content:
${content.substring(0, 8000)} ${content.length > 8000 ? '...' : ''}

Please respond in JSON format:
{
  "shortSummary": "Brief one-line summary",
  "longSummary": "Detailed multi-paragraph summary",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "category name"
}`;
  }

  protected parseAIResponse(response: string): Partial<AISummaryResult> {
    try {
      const parsed = JSON.parse(response);
      return {
        shortSummary: parsed.shortSummary || 'AI summary not available',
        longSummary: parsed.longSummary || 'Detailed summary not available',
        tags: parsed.tags || [],
        category: parsed.category || 'Uncategorized',
      };
    } catch (error) {
      // Fallback: try to extract meaningful content from non-JSON response
      const lines = response.split('\n').filter((line) => line.trim());
      return {
        shortSummary: lines[0]?.substring(0, 150) || 'AI summary not available',
        longSummary: response.substring(0, 1000) || 'Detailed summary not available',
        tags: [],
        category: 'Uncategorized',
      };
    }
  }

  protected createErrorResult(error: string): AISummaryResult {
    return {
      shortSummary: 'Error processing content',
      longSummary: `Failed to generate AI summary: ${error}`,
      provider: this.name,
      confidence: 0,
      error,
    };
  }
}
