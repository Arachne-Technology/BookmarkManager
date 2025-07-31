import type { AIProvider, AIProviderConfig, AISummaryResult, ContentSufficiencyResult, ResponseQualityAssessment, ResponseQualityIssue } from './types';

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
      qualityScore: 0,
      qualityIssues: ['Processing failed'],
    };
  }

  protected assessResponseQuality(result: AISummaryResult, originalContent: string, _url: string): ResponseQualityAssessment {
    const issues: ResponseQualityIssue[] = [];
    let qualityScore = 1.0;

    // Check for error acknowledgment patterns
    const errorPatterns = [
      /I apologize.*cannot.*generate/i,
      /sorry.*unable to/i,
      /I cannot.*provide/i,
      /incomplete.*content.*provided/i,
      /would need.*complete.*content/i,
      /please.*share.*complete/i,
      /without.*actual.*content/i,
      /only contains.*elements/i,
    ];

    const longSummary = result.longSummary?.toLowerCase() || '';
    const shortSummary = result.shortSummary?.toLowerCase() || '';
    const combinedText = `${shortSummary} ${longSummary}`;

    for (const pattern of errorPatterns) {
      if (pattern.test(combinedText)) {
        issues.push({
          type: 'error_acknowledgment',
          severity: 'high',
          description: 'AI explicitly acknowledged inability to analyze content',
          suggestedFix: 'Try different scraping method or use metadata only',
        });
        qualityScore -= 0.8;
        break;
      }
    }

    // Check for generic/placeholder responses
    const genericPatterns = [
      /summary not available/i,
      /detailed summary not available/i,
      /unable to determine/i,
      /not enough information/i,
      /generic.*description/i,
    ];

    for (const pattern of genericPatterns) {
      if (pattern.test(combinedText)) {
        issues.push({
          type: 'generic_response',
          severity: 'medium',
          description: 'Response contains generic placeholder text',
          suggestedFix: 'Retry analysis with different scraping approach',
        });
        qualityScore -= 0.4;
        break;
      }
    }

    // Check for insufficient content signals
    const insufficientPatterns = [
      /google tag manager/i,
      /iframe.*elements/i,
      /javascript.*required/i,
      /cookies.*policy/i,
      /accept.*cookies/i,
      /loading.*please.*wait/i,
    ];

    for (const pattern of insufficientPatterns) {
      if (pattern.test(combinedText) || pattern.test(originalContent)) {
        issues.push({
          type: 'insufficient_content',
          severity: 'high',
          description: 'Content appears to be mostly page infrastructure rather than meaningful content',
          suggestedFix: 'Use alternative scraping method or mark as low-priority',
        });
        qualityScore -= 0.6;
        break;
      }
    }

    // Check summary length and depth
    if (result.shortSummary && result.shortSummary.length < 20) {
      issues.push({
        type: 'incomplete_analysis',
        severity: 'medium',
        description: 'Summary is unusually short',
        suggestedFix: 'Verify content extraction quality',
      });
      qualityScore -= 0.2;
    }

    if (result.longSummary && result.longSummary.length < 50) {
      issues.push({
        type: 'incomplete_analysis',
        severity: 'medium',
        description: 'Detailed summary is unusually short',
        suggestedFix: 'Check if content was properly extracted',
      });
      qualityScore -= 0.2;
    }

    // Check for low confidence indicators
    if (result.confidence < 0.5) {
      issues.push({
        type: 'low_confidence',
        severity: 'medium',
        description: 'AI provider reported low confidence in analysis',
        suggestedFix: 'Consider retrying or using different provider',
      });
      qualityScore -= 0.3;
    }

    // Check for blocked content indicators
    const blockedPatterns = [
      /access.*denied/i,
      /permission.*required/i,
      /sign.*in.*required/i,
      /subscription.*required/i,
      /paywall/i,
      /403.*forbidden/i,
      /404.*not.*found/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(combinedText) || pattern.test(originalContent)) {
        issues.push({
          type: 'content_blocked',
          severity: 'high',
          description: 'Content appears to be behind authentication or paywall',
          suggestedFix: 'Use metadata only or mark as inaccessible',
        });
        qualityScore -= 0.7;
        break;
      }
    }

    // Ensure quality score doesn't go below 0
    qualityScore = Math.max(0, qualityScore);

    // Determine suggested action based on issues
    let suggestedAction: ResponseQualityAssessment['suggestedAction'] = 'accept';
    
    if (qualityScore < 0.3) {
      suggestedAction = 'mark_as_failed';
    } else if (issues.some(issue => issue.type === 'error_acknowledgment' || issue.type === 'content_blocked')) {
      suggestedAction = 'retry_different_scraping';
    } else if (issues.some(issue => issue.type === 'insufficient_content')) {
      suggestedAction = 'retry_different_scraping';
    } else if (qualityScore < 0.6) {
      suggestedAction = 'use_metadata_only';
    }

    return {
      isHighQuality: qualityScore >= 0.7 && issues.length === 0,
      qualityScore,
      issues,
      suggestedAction,
      confidence: qualityScore,
    };
  }
}
