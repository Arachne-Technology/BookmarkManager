import puppeteer, { type Browser, type Page } from 'puppeteer';
import type { WebPageContent } from './types';

export class WebScraperService {
  private browser: Browser | null = null;
  // private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'; // Commented out as unused

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
  }

  async scrapeContent(url: string): Promise<WebPageContent> {
    await this.initialize();

    let page: Page | null = null;

    try {
      page = await this.browser!.newPage();

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      if (!response || !response.ok()) {
        return {
          url,
          title: '',
          textContent: '',
          metaDescription: '',
          error: `Failed to load page: ${response?.status() || 'Unknown error'}`,
        };
      }

      // Extract content
      const content = await page.evaluate(() => {
        // Remove scripts and styles
        const scripts = (document as any).querySelectorAll('script, style');
        scripts.forEach((el: any) => el.remove());

        return {
          title: (document as any).title || '',
          textContent: (document as any).body?.innerText || '',
          metaDescription:
            ((document as any).querySelector('meta[name="description"]') as any)?.content || '',
        };
      });

      return {
        url,
        title: content.title,
        textContent: content.textContent.substring(0, 5000), // Limit content size
        metaDescription: content.metaDescription,
      };
    } catch (error) {
      console.error('Error scraping content:', error);
      return {
        url,
        title: '',
        textContent: '',
        metaDescription: '',
        error: error instanceof Error ? error.message : 'Unknown scraping error',
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Check if URL is accessible
  async checkUrl(url: string): Promise<boolean> {
    await this.initialize();

    let page: Page | null = null;

    try {
      page = await this.browser!.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      return response?.ok() || false;
    } catch (error) {
      console.error('Error checking URL:', error);
      return false;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}
