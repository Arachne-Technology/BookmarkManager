import type { AIProvider, AIProviderConfig, AISummaryResult, ContentSufficiencyResult } from './types';

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract get name(): string;
  abstract summarize(content: string, url: string, title?: string): Promise<AISummaryResult>;
  abstract assessContentSufficiency(content: string, url: string, title?: string): Promise<ContentSufficiencyResult>;
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

  protected createSufficiencyPrompt(content: string, url: string, title?: string): string {
    return `Please assess if the following content is sufficient for generating a meaningful bookmark summary and categorization.

URL: ${url}
Title: ${title || 'No title'}
Content length: ${content.length} characters

Content preview:
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

Please respond in JSON format:
{
  "isSufficient": boolean,
  "confidence": number (0-1),
  "reason": "explanation of assessment",
  "suggestedAction": "use_current" | "fetch_more" | "metadata_only"
}

Consider:
- Is there enough meaningful text content for categorization?
- Can we understand what this page is about from the available content?
- Would fetching more content significantly improve analysis quality?`;
  }

  protected parseSufficiencyResponse(response: string, content: string, title?: string): ContentSufficiencyResult {
    try {
      const parsed = JSON.parse(response);
      return {
        isSufficient: parsed.isSufficient || false,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        reason: parsed.reason || 'No assessment reason provided',
        suggestedAction: parsed.suggestedAction || 'fetch_more',
      };
    } catch (error) {
      // Fallback assessment based on content length and structure
      const totalLength = content.length + (title?.length || 0);
      return {
        isSufficient: totalLength > 200,
        confidence: 0.5,
        reason: 'Fallback assessment based on content length',
        suggestedAction: totalLength > 200 ? 'use_current' : 'fetch_more',
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
