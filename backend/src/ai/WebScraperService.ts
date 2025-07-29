// import puppeteer, { Browser, Page } from 'puppeteer';
import { WebPageContent } from './types';

// Temporary type definitions for development
type Browser = any;

export class WebScraperService {
  private browser: Browser | null = null;
  // private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'; // Commented out as unused

  async initialize(): Promise<void> {
    if (!this.browser) {
      // Temporarily disabled for development - install puppeteer first
      throw new Error('Puppeteer not available - please run: npm install puppeteer');
      /* 
      const puppeteer = require('puppeteer');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      */
    }
  }

  async scrapeContent(url: string): Promise<WebPageContent> {
    // Return a placeholder result for development
    return {
      url,
      title: 'Demo Title - Puppeteer not installed',
      textContent: 'This is demo content. To enable web scraping, install Puppeteer by running: npm install puppeteer',
      metaDescription: 'Demo description',
      error: 'Puppeteer not available - development mode'
    };
    
    /* Original implementation commented out - uncomment after installing puppeteer
    await this.initialize();
    // ... rest of implementation ...
    */
  }

  async close(): Promise<void> {
    // No-op for development mode
    if (this.browser) {
      // await this.browser.close();
      this.browser = null;
    }
  }

  // Check if URL is accessible
  async checkUrl(url: string): Promise<boolean> {
    // Return true for development mode
    console.log('URL check (development mode):', url);
    return true;
    
    /* Original implementation - uncomment after installing puppeteer
    await this.initialize();
    
    let page: Page | null = null;
    
    try {
      page = await this.browser!.newPage();
      await page.setUserAgent(this.userAgent);
      
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      return response?.ok() || false;
    } catch (error) {
      return false;
    } finally {
      if (page) {
        await page.close();
      }
    }
    */
  }
}