import { BaseAIProvider } from '../BaseAIProvider';
import type { AIProviderConfig, AISummaryResult } from '../types';

export class ClaudeProvider extends BaseAIProvider {
  private static readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private static readonly MODELS_URL = 'https://api.anthropic.com/v1/models';

  constructor(config: AIProviderConfig) {
    super(config);
  }

  static async fetchAvailableModels(
    apiKey: string
  ): Promise<{ models: { id: string; name: string; description?: string }[]; error?: string }> {
    try {
      const response = await fetch(ClaudeProvider.MODELS_URL, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = (await response.json()) as any;

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from Claude API');
      }

      const models = data.data.map((model: any) => ({
        id: model.id,
        name: model.display_name || model.id,
        description: `Model created: ${new Date(model.created_at).toLocaleDateString()}`,
      }));

      return { models };
    } catch (error) {
      console.error('Error fetching Claude models:', error);
      return {
        models: [],
        error: error instanceof Error ? error.message : 'Failed to fetch Claude models',
      };
    }
  }

  get name(): string {
    return 'claude';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async validateConfig(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(ClaudeProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-5-haiku-20241022',
          max_tokens: 100,
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
      console.error('Claude API validation failed:', error);
      return false;
    }
  }

  async summarize(content: string, url: string, title?: string): Promise<AISummaryResult> {
    if (!this.isConfigured()) {
      return this.createErrorResult('Claude API key not configured');
    }

    try {
      const prompt = this.createPrompt(content, url, title);

      const response = await fetch(ClaudeProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-5-haiku-20241022',
          max_tokens: this.config.maxTokens || 1000,
          temperature: this.config.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ error: 'Unknown error' }))) as any;
        throw new Error(
          `Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = (await response.json()) as any;
      const aiResponse = data.content?.[0]?.text || '';

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
      console.error('Claude summarization error:', error);
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
