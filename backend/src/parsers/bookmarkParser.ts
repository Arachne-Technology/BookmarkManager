import * as cheerio from 'cheerio';
import { readFile } from 'fs/promises';
import { setupLogger } from '../utils/logger';

const logger = setupLogger();

export interface ParsedBookmark {
  title: string;
  url: string;
  folderPath: string;
  addDate?: number;
  icon?: string;
}

export async function parseBookmarkFile(filePath: string): Promise<ParsedBookmark[]> {
  try {
    const htmlContent = await readFile(filePath, 'utf8');
    const $ = cheerio.load(htmlContent);
    const bookmarks: ParsedBookmark[] = [];
    
    function traverseBookmarks($element: cheerio.Cheerio<cheerio.Element>, currentPath: string = '') {
      $element.children().each((index, element) => {
        const $el = $(element);
        
        if ($el.is('dt')) {
          const $link = $el.find('a').first();
          const $folder = $el.find('h3').first();
          
          if ($link.length > 0) {
            const href = $link.attr('href');
            const title = $link.text().trim();
            const addDate = $link.attr('add_date');
            const icon = $link.attr('icon');
            
            if (href && title) {
              bookmarks.push({
                title,
                url: href,
                folderPath: currentPath,
                addDate: addDate ? parseInt(addDate) : undefined,
                icon
              });
            }
          } else if ($folder.length > 0) {
            const folderName = $folder.text().trim();
            const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            
            const $dl = $el.find('dl').first();
            if ($dl.length > 0) {
              traverseBookmarks($dl, newPath);
            }
          }
        } else if ($el.is('dl')) {
          traverseBookmarks($el, currentPath);
        }
      });
    }
    
    const $root = $('dl').first();
    if ($root.length > 0) {
      traverseBookmarks($root);
    }
    
    logger.info(`Parsed ${bookmarks.length} bookmarks from file: ${filePath}`);
    
    return bookmarks;
  } catch (error) {
    logger.error('Error parsing bookmark file:', error);
    throw new Error(`Failed to parse bookmark file: ${error}`);
  }
}