// Import dependencies for HTML parsing and file operations
import * as cheerio from 'cheerio'; // jQuery-like server-side HTML parsing
import { readFile } from 'fs/promises'; // Promise-based file reading
import { setupLogger } from '../utils/logger';

// Initialize logger for this module
const logger = setupLogger();

/**
 * Interface defining the structure of a parsed bookmark
 * This represents a single bookmark extracted from the HTML file
 */
export interface ParsedBookmark {
  title: string;      // Display name of the bookmark
  url: string;        // Target URL of the bookmark
  folderPath: string; // Hierarchical folder path (e.g., "Bookmarks/Work/Development")
  addDate?: number;   // Optional timestamp when bookmark was added (Unix timestamp)
  icon?: string;      // Optional base64-encoded favicon data
}

/**
 * Parses an HTML bookmark export file and extracts all bookmarks with their folder structure
 * Supports bookmark exports from Chrome, Firefox, Safari, and Edge browsers
 * 
 * @param filePath - Absolute path to the HTML bookmark file
 * @returns Promise resolving to array of parsed bookmarks with their folder hierarchy
 */
export async function parseBookmarkFile(filePath: string): Promise<ParsedBookmark[]> {
  try {
    // Read the HTML content from the uploaded bookmark file
    const htmlContent = await readFile(filePath, 'utf8');
    // Load HTML into Cheerio for jQuery-like DOM manipulation
    const $ = cheerio.load(htmlContent);
    // Array to store all parsed bookmarks
    const bookmarks: ParsedBookmark[] = [];
    
    /**
     * Recursively traverses the bookmark HTML structure to extract bookmarks and folders
     * Browser bookmark exports use nested <dl> and <dt> tags to represent folder hierarchy
     * 
     * @param $element - Cheerio element to traverse (typically a <dl> definition list)
     * @param currentPath - Current folder path being traversed (e.g., "Work/Development")
     */
    function traverseBookmarks($element: cheerio.Cheerio<any>, currentPath: string = '') {
      // Iterate through each child element in the current DOM level
      $element.children().each((_, element) => {
        const $el = $(element);
        
        // Check if current element is a definition term (<dt>) which contains bookmarks or folders
        if ($el.is('dt')) {
          // Look for bookmark links (<a> tags) and folder headers (<h3> tags)
          // Use children() instead of find() to only get direct children, not nested elements
          const $link = $el.children('a').first();
          const $folder = $el.children('h3').first();
          
          // Process bookmark links
          if ($link.length > 0) {
            // Extract bookmark attributes from the <a> tag
            const href = $link.attr('href');         // URL of the bookmark
            const title = $link.text().trim();       // Display name
            const addDate = $link.attr('add_date');  // When bookmark was created
            const icon = $link.attr('icon');         // Base64 favicon data
            
            // Only process valid bookmarks with both URL and title
            if (href && title) {
              const bookmark: ParsedBookmark = {
                title,
                url: href,
                folderPath: currentPath // Current folder hierarchy
              };
              
              // Add optional metadata if present
              if (addDate) {
                bookmark.addDate = parseInt(addDate); // Convert string to number
              }
              
              if (icon) {
                bookmark.icon = icon;
              }
              
              // Add completed bookmark to results array
              bookmarks.push(bookmark);
            }
          // Process folder headers (bookmark folders)
          } else if ($folder.length > 0) {
            // Extract folder name and build hierarchical path
            const folderName = $folder.text().trim();
            // Append folder name to current path, handling root level folders
            const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            
            // Look for <dl> element that contains this folder's bookmarks
            // The DL could be a sibling of the H3 within the DT, or the next sibling of the DT
            let $dl = $el.find('dl').first(); // Look inside the DT first
            if ($dl.length === 0) {
              // If not found inside, try next sibling
              $dl = $el.next('dl');
              if ($dl.length === 0) {
                // If still not found, look for the next DL among subsequent siblings
                $dl = $el.nextAll('dl').first();
              }
            }
            if ($dl.length > 0) {
              // Recursively parse bookmarks within this folder
              traverseBookmarks($dl, newPath);
            }
          }
        // Handle cases where <dl> appears as direct child (browser export format variations)
        } else if ($el.is('dl')) {
          traverseBookmarks($el, currentPath);
        }
      });
    }
    
    // Start parsing from the root bookmark list
    const $root = $('dl').first();
    if ($root.length > 0) {
      traverseBookmarks($root);
    }
    
    // Log successful parsing statistics
    logger.info(`Parsed ${bookmarks.length} bookmarks from file: ${filePath}`);
    
    return bookmarks;
  } catch (error) {
    // Log detailed error information for debugging
    logger.error('Error parsing bookmark file:', error);
    throw new Error(`Failed to parse bookmark file: ${error}`);
  }
}