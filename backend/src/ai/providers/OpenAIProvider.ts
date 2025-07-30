import { BaseAIProvider } from '../BaseAIProvider';
import type { AIProviderConfig, AISummaryResult, ContentSufficiencyResult } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly MODELS_URL = 'https://api.openai.com/v1/models';

  constructor(config: AIProviderConfig) {
    super(config);
  }

  static async fetchAvailableModels(
    apiKey: string
  ): Promise<{ models: { id: string; name: string; description?: string }[]; error?: string }> {
    try {
      const response = await fetch(OpenAIProvider.MODELS_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as any;

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenAI API');
      }

      // Filter for chat completion models and sort by created date (newest first)
      const chatModels = data.data
        .filter((model: any) => model.id.includes('gpt') || model.id.includes('o1'))
        .sort((a: any, b: any) => b.created - a.created)
        .map((model: any) => ({
          id: model.id,
          name: model.id.toUpperCase().replace(/-/g, ' '),
          description: `Created: ${new Date(model.created * 1000).toLocaleDateString()}`,
        }));

      return { models: chatModels };
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return {
        models: [],
        error: error instanceof Error ? error.message : 'Failed to fetch OpenAI models',
      };
    }
  }

  get name(): string {
    return 'openai';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async validateConfig(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(OpenAIProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey!}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          max_tokens: 50,
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message to validate the API configuration.',
            },
          ],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI API validation failed:', error);
      return false;
    }
  }

  async summarize(content: string, url: string, title?: string): Promise<AISummaryResult> {
    if (!this.isConfigured()) {
      return this.createErrorResult('OpenAI API key not configured');
    }

    try {
      const prompt = this.createPrompt(content, url, title);

      const response = await fetch(OpenAIProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey!}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          max_tokens: this.config.maxTokens || 1000,
          temperature: this.config.temperature || 0.7,
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that analyzes web page content and provides structured summaries in JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ error: { message: 'Unknown error' } }))) as any;
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = (await response.json()) as any;
      const aiResponse = data.choices?.[0]?.message?.content || '';

      const parsed = this.parseAIResponse(aiResponse);

      return {
        shortSummary: parsed.shortSummary || 'No summary available',
        longSummary: parsed.longSummary || 'No detailed summary available',
        tags: parsed.tags || [],
        category: parsed.category || 'Uncategorized',
        provider: this.name,
        confidence: 0.8,
      };
    } catch (error) {
      console.error('OpenAI summarization error:', error);
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async assessContentSufficiency(content: string, url: string, title?: string): Promise<ContentSufficiencyResult> {
    if (!this.isConfigured()) {
      // Fallback to simple heuristic if AI is not available
      const totalLength = content.length + (title?.length || 0);
      return {
        isSufficient: totalLength > 200,
        confidence: 0.6,
        reason: 'Heuristic assessment - OpenAI API not configured',
        suggestedAction: totalLength > 500 ? 'use_current' : 'fetch_more',
      };
    }

    try {
      const prompt = this.createSufficiencyPrompt(content, url, title);

      const response = await fetch(OpenAIProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey!}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          max_tokens: 200, // Small response for assessment
          temperature: 0.3, // Lower temperature for more consistent assessment
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that assesses content sufficiency for bookmark analysis. Always respond in valid JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const aiResponse = data.choices?.[0]?.message?.content || '';

      return this.parseSufficiencyResponse(aiResponse, content, title);
    } catch (error) {
      console.error('OpenAI content sufficiency assessment failed:', error);
      
      // Fallback to heuristic assessment
      const totalLength = content.length + (title?.length || 0);
      return {
        isSufficient: totalLength > 200,
        confidence: 0.5,
        reason: `AI assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback heuristic.`,
        suggestedAction: totalLength > 500 ? 'use_current' : 'fetch_more',
      };
    }
  }
}
