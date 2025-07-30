/**
 * Simple in-memory cache for AI model lists to avoid excessive API calls
 */

interface CacheEntry {
  models: { id: string; name: string; description?: string }[];
  timestamp: number;
  error?: string;
}

class ModelCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(provider: string, apiKeyHash: string): string {
    return `${provider}:${apiKeyHash}`;
  }

  private hashApiKey(apiKey: string): string {
    // Simple hash to avoid storing actual API keys
    return Buffer.from(apiKey).toString('base64').slice(0, 16);
  }

  get(provider: string, apiKey: string): CacheEntry | null {
    const key = this.getCacheKey(provider, this.hashApiKey(apiKey));
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(
    provider: string,
    apiKey: string,
    result: { models: { id: string; name: string; description?: string }[]; error?: string }
  ): void {
    const key = this.getCacheKey(provider, this.hashApiKey(apiKey));
    const entry: CacheEntry = {
      models: result.models,
      timestamp: Date.now(),
      ...(result.error && { error: result.error }),
    };

    this.cache.set(key, entry);

    // Clean up old entries periodically
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const modelCache = new ModelCache();
