interface BookmarkForExport {
  id: string;
  title: string;
  url: string;
  folder_path: string;
  original_index: number;
  status: string;
  created_at: string;
}

export function generateBookmarkHTML(bookmarks: BookmarkForExport[]): string {
  const folderStructure = buildFolderStructure(bookmarks);
  const htmlContent = generateFolderHTML(folderStructure);
  
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${htmlContent}
</DL><p>`;
}

interface FolderNode {
  name: string;
  bookmarks: BookmarkForExport[];
  subfolders: Map<string, FolderNode>;
}

function buildFolderStructure(bookmarks: BookmarkForExport[]): FolderNode {
  const root: FolderNode = {
    name: '',
    bookmarks: [],
    subfolders: new Map()
  };
  
  bookmarks.forEach(bookmark => {
    if (!bookmark.folder_path || bookmark.folder_path.trim() === '') {
      root.bookmarks.push(bookmark);
      return;
    }
    
    const pathParts = bookmark.folder_path.split('/').filter(part => part.trim() !== '');
    let currentNode = root;
    
    pathParts.forEach(folderName => {
      if (!currentNode.subfolders.has(folderName)) {
        currentNode.subfolders.set(folderName, {
          name: folderName,
          bookmarks: [],
          subfolders: new Map()
        });
      }
      currentNode = currentNode.subfolders.get(folderName)!;
    });
    
    currentNode.bookmarks.push(bookmark);
  });
  
  return root;
}

function generateFolderHTML(node: FolderNode, depth: number = 0): string {
  let html = '';
  const indent = '    '.repeat(depth);
  
  node.bookmarks
    .sort((a, b) => a.original_index - b.original_index)
    .forEach(bookmark => {
      const title = escapeHtml(bookmark.title || 'Untitled');
      const url = escapeHtml(bookmark.url);
      
      html += `${indent}    <DT><A HREF="${url}">${title}</A>\n`;
    });
  
  Array.from(node.subfolders.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(subfolder => {
      const folderName = escapeHtml(subfolder.name);
      html += `${indent}    <DT><H3>${folderName}</H3>\n`;
      html += `${indent}    <DL><p>\n`;
      html += generateFolderHTML(subfolder, depth + 1);
      html += `${indent}    </DL><p>\n`;
    });
  
  return html;
}

function escapeHtml(text: string): string {
  const div = { textContent: text } as any;
  return div.innerHTML || text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}