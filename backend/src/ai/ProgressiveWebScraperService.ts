import axios from 'axios';
import * as cheerio from 'cheerio';
import type { WebPageContent } from './types';


interface ContentExtractionConfig {
  quickAnalysisLimit: number;    // Phase 1: First X bytes to analyze
  fullContentLimit: number;      // Phase 2: Maximum full content size
  timeout: number;               // Request timeout
  minContentLength: number;      // Minimum content needed for analysis
}

export class ProgressiveWebScraperService {
  private readonly config: ContentExtractionConfig = {
    quickAnalysisLimit: 50 * 1024,      // 50KB for quick analysis
    fullContentLimit: 500 * 1024,       // 500KB maximum for full content
    timeout: 10000,                     // 10 seconds
    minContentLength: 200,               // At least 200 chars for meaningful analysis
  };

  private readonly desktopHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
  };

  private readonly mobileHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'DNT': '1',
  };

  private readonly readerModeVariants = [
    '?reader=true',
    '?text=true', 
    '?print=true',
    '?mobile=true',
    '?amp=1',
    '/amp',
    '?view=reader',
    '?format=text'
  ];

  /**
   * Main entry point - tiered content extraction strategy
   */
  async scrapeContent(url: string): Promise<WebPageContent> {
    console.log(`Starting tiered content extraction for ${url}`);

    // Tier 1: Try reader mode variants
    const readerResult = await this.tryReaderMode(url);
    if (readerResult) {
      console.log(`Reader mode successful for ${url}`);
      return readerResult;
    }

    // Tier 2: Try mobile user agent
    const mobileResult = await this.tryMobileVersion(url);
    if (mobileResult) {
      console.log(`Mobile version successful for ${url}`);
      return mobileResult;
    }

    // Tier 3: Download to temporary storage and extract
    console.log(`Both reader and mobile failed for ${url}, using disk-based extraction`);
    return await this.diskBasedExtraction(url);
  }

  /**
   * Tier 1: Try reader mode variants
   */
  private async tryReaderMode(url: string): Promise<WebPageContent | null> {
    for (const variant of this.readerModeVariants) {
      try {
        let readerUrl: string;
        
        // Handle different types of reader URL variants
        if (variant.startsWith('/')) {
          // Path-based like '/amp'
          const urlObj = new URL(url);
          readerUrl = `${urlObj.origin}${variant}${urlObj.pathname}${urlObj.search}`;
        } else if (variant.startsWith('?')) {
          // Query-based like '?reader=true'
          const separator = url.includes('?') ? '&' : '?';
          readerUrl = url + separator + variant.substring(1);
        } else {
          continue; // Skip invalid variants
        }

        console.log(`Trying reader mode: ${readerUrl}`);
        
        const response = await axios.get(readerUrl, {
          timeout: 5000, // Shorter timeout for reader mode attempts
          headers: this.desktopHeaders,
          maxContentLength: this.config.quickAnalysisLimit,
          responseType: 'text',
        });

        if (response.status === 200 && response.data) {
          const $ = cheerio.load(response.data);
          const content = this.extractContentFromHtml($);
          
          // Check if we got meaningful content (not just a redirect or error page)
          if (content.title && content.textContent.length > this.config.minContentLength) {
            const result: WebPageContent = {
              url: readerUrl, // Use the reader URL that worked
              title: content.title,
              textContent: content.textContent,
            };
            if (content.metaDescription) {
              result.metaDescription = content.metaDescription;
            }
            return result;
          }
        }
      } catch (error) {
        // Silently try next variant
        continue;
      }
    }
    
    return null; // No reader mode worked
  }

  /**
   * Tier 2: Try mobile user agent
   */
  private async tryMobileVersion(url: string): Promise<WebPageContent | null> {
    try {
      console.log(`Trying mobile version for ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: this.mobileHeaders,
        maxContentLength: this.config.quickAnalysisLimit,
        responseType: 'text',
      });

      if (response.status === 200 && response.data) {
        const $ = cheerio.load(response.data);
        const content = this.extractContentFromHtml($);
        
        // Check if mobile version gave us good content
        if (content.title && content.textContent.length > this.config.minContentLength) {
          const result: WebPageContent = {
            url,
            title: content.title,
            textContent: content.textContent,
          };
          if (content.metaDescription) {
            result.metaDescription = content.metaDescription;
          }
          return result;
        }
      }
    } catch (error) {
      console.log(`Mobile version failed for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return null; // Mobile version didn't work
  }

  /**
   * Tier 3: Download to temporary storage and extract smartly
   */
  private async diskBasedExtraction(url: string): Promise<WebPageContent> {
    const fs = await import('fs');
    const path = await import('path');
    const crypto = await import('crypto');
    
    // Create a temporary file for this URL
    const tempDir = path.join(process.cwd(), 'temp');
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    const tempFile = path.join(tempDir, `content-${urlHash}.html`);
    
    try {
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      console.log(`Downloading ${url} to temporary storage...`);
      
      // Download with no size limit to temporary file
      const response = await axios.get(url, {
        timeout: 30000, // Longer timeout for large downloads
        headers: this.desktopHeaders,
        responseType: 'stream', // Stream to avoid memory issues
      });

      // Write to temporary file
      const writeStream = fs.createWriteStream(tempFile);
      response.data.pipe(writeStream);
      
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      console.log(`Downloaded ${url} to ${tempFile}, now extracting content...`);
      
      // Read and process the file smartly
      const content = await this.extractFromDiskFile(tempFile, url);
      
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temp file ${tempFile}`);
      }
      
      return content;
      
    } catch (error) {
      // Clean up on error
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      console.error(`Disk-based extraction failed for ${url}:`, error);
      
      // Final fallback to URL-only analysis
      return this.urlOnlyAnalysis(url);
    }
  }

  /**
   * Extract content from downloaded file using smart parsing
   */
  private async extractFromDiskFile(filePath: string, originalUrl: string): Promise<WebPageContent> {
    const fs = await import('fs');
    
    try {
      // Read file in chunks to find the head section efficiently
      const fileSize = fs.statSync(filePath).size;
      const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      
      let htmlContent = '';
      let foundHead = false;
      let foundTitle = false;
      let foundMetaDescription = false;
      let foundBodyStart = false;
      
      // Read the file in chunks, stopping when we have enough content
      for await (const chunk of readStream) {
        htmlContent += chunk;
        
        // Track what we've found
        if (!foundHead && htmlContent.includes('<head>')) foundHead = true;
        if (!foundTitle && htmlContent.includes('<title>')) foundTitle = true;
        if (!foundMetaDescription && (htmlContent.includes('name="description"') || htmlContent.includes('property="og:description"'))) {
          foundMetaDescription = true;
        }
        if (!foundBodyStart && htmlContent.includes('<body')) foundBodyStart = true;
        
        // Stop reading when we have enough for good extraction
        if (foundTitle && foundMetaDescription && foundBodyStart && htmlContent.length > 50 * 1024) {
          break;
        }
        
        // Safety limit - don't read more than 200KB into memory
        if (htmlContent.length > 200 * 1024) {
          break;
        }
      }
      
      readStream.destroy(); // Stop reading
      
      console.log(`Read ${htmlContent.length} characters from ${filePath} (file size: ${fileSize})`);
      
      // Parse the content we have
      const $ = cheerio.load(htmlContent);
      const content = this.extractContentFromHtml($);
      
      const result: WebPageContent = {
        url: originalUrl,
        title: content.title || 'Untitled',
        textContent: content.textContent || 'No content extracted',
      };
      
      if (content.metaDescription) {
        result.metaDescription = content.metaDescription;
      }
      
      return result;
      
    } catch (error) {
      console.error(`Failed to extract from disk file ${filePath}:`, error);
      
      // Fallback to URL-only analysis
      return this.urlOnlyAnalysis(originalUrl);
    }
  }

  /**
   * Final fallback: URL-only analysis
   */
  private urlOnlyAnalysis(url: string): WebPageContent {
    try {
      // Extract meaningful information from the URL itself
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      
      // Clean up the path for analysis
      const pathParts = urlObj.pathname
        .split('/')
        .filter(part => part.length > 0)
        .map(part => part.replace(/[-_]/g, ' '))
        .join(' ');

      // Create a meaningful title from URL structure
      const urlTitle = pathParts || domain;
      
      // Generate description from URL components
      const urlDescription = `Content from ${domain}${pathParts ? ': ' + pathParts : ''}`;
      
      return {
        url,
        title: urlTitle,
        textContent: urlDescription,
      };

    } catch (error) {
      // Absolute final fallback
      return {
        url,
        title: 'Unknown Website',
        textContent: `Website: ${url}`,
      };
    }
  }


  /**
   * Extract meaningful content from HTML using cheerio
   */
  private extractContentFromHtml($: cheerio.CheerioAPI) {
    // Remove non-content elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .popup, .modal').remove();

    // Extract title with fallbacks
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('h1').first().text().trim() || '';

    // Extract meta description
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';

    // Extract main content using priority selectors
    let textContent = '';
    const contentSelectors = [
      'main article',
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-body',
      '.article-content',
      '[role="main"]',
      'body'
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).first().text().trim();
      if (content && content.length > textContent.length) {
        textContent = content;
      }
    }

    // Clean up whitespace and limit length
    textContent = textContent
      .replace(/\s+/g, ' ')
      .substring(0, 5000); // Reasonable limit for AI processing

    return {
      title,
      textContent,
      metaDescription,
    };
  }

  /**
   * Simple URL accessibility check
   */
  async checkUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: this.desktopHeaders,
      });
      return response.status < 400;
    } catch (error) {
      return false;
    }
  }

}