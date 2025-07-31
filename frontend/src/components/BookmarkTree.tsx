import {
  Bookmark as BookmarkIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Folder,
  FolderOpen,
  Minus,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useSelection } from '../hooks/useSelection';
import type { Bookmark } from '../services/api';

interface BookmarkTreeProps {
  bookmarks: Bookmark[];
  onSelectionChange?: (selectedBookmarks: Bookmark[]) => void;
  onBookmarkClick?: (bookmark: Bookmark) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'bookmark';
  bookmark?: Bookmark;
  children: TreeNode[];
  isExpanded?: boolean;
}

export function BookmarkTree({ bookmarks, onSelectionChange, onBookmarkClick }: BookmarkTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const selection = useSelection(bookmarks);

  // Notify parent of selection changes
  const selectedBookmarks = React.useMemo(() => 
    selection.getSelectedBookmarks(), 
    [selection.selectedCount, bookmarks]
  );

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedBookmarks);
    }
  }, [selectedBookmarks, onSelectionChange]);

  const { tree, folderPaths } = useMemo(() => {
    const root: TreeNode = { name: 'Root', path: '', type: 'folder', children: [] };
    const folderMap = new Map<string, TreeNode>();
    folderMap.set('', root);

    // Sort bookmarks by folder path and title for consistent display
    const sortedBookmarks = [...bookmarks].sort((a, b) => {
      if (a.folder_path !== b.folder_path) {
        return a.folder_path.localeCompare(b.folder_path);
      }
      return a.title.localeCompare(b.title);
    });

    sortedBookmarks.forEach((bookmark) => {
      const folderPath = bookmark.folder_path || '';
      const pathParts = folderPath ? folderPath.split('/').filter((part) => part.trim()) : [];

      // Create folder structure
      let currentPath = '';
      let currentParent = root;

      pathParts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!folderMap.has(currentPath)) {
          const folderNode: TreeNode = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
          folderMap.set(currentPath, folderNode);
          currentParent.children.push(folderNode);
        }

        currentParent = folderMap.get(currentPath)!;
      });

      // Add bookmark to the appropriate folder
      const bookmarkNode: TreeNode = {
        name: bookmark.title || 'Untitled',
        path: `${folderPath}/${bookmark.id}`,
        type: 'bookmark',
        bookmark,
        children: [],
      };

      currentParent.children.push(bookmarkNode);
    });

    return { tree: root, folderPaths: Array.from(folderMap.keys()) };
  }, [bookmarks]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderNode = (
    node: TreeNode,
    depth: number = 0,
    bookmarkIndex: { current: number } = { current: 0 }
  ) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.length > 0;

    if (node.type === 'bookmark') {
      const currentIndex = bookmarkIndex.current++;
      return (
        <BookmarkItem
          key={node.path}
          bookmark={node.bookmark!}
          depth={depth}
          isEvenRow={currentIndex % 2 === 0}
          isSelected={selection.isBookmarkSelected(node.bookmark!.id)}
          onToggleSelect={() => selection.toggleBookmark(node.bookmark!.id)}
          onBookmarkClick={onBookmarkClick}
        />
      );
    }

    // Skip rendering the root node
    if (node.path === '') {
      return <div key="root">{node.children.map((child) => renderNode(child, depth))}</div>;
    }

    return (
      <div key={node.path}>
        <FolderItem
          name={node.name}
          path={node.path}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          depth={depth}
          onToggle={() => toggleFolder(node.path)}
          isSelected={selection.isFolderSelected(node.path)}
          isPartiallySelected={selection.isFolderPartiallySelected(node.path)}
          onToggleSelect={() => selection.toggleFolder(node.path)}
        />
        {isExpanded && hasChildren && (
          <div>{node.children.map((child) => renderNode(child, depth + 1, bookmarkIndex))}</div>
        )}
      </div>
    );
  };

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No bookmarks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bookmarks ({bookmarks.length})</h3>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <button
              onClick={selection.selectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All ({bookmarks.length})
            </button>
            {selection.selectedCount > 0 && (
              <button
                onClick={selection.clearSelection}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear ({selection.selectedCount})
              </button>
            )}
          </div>
          <button
            onClick={() => setExpandedFolders(new Set(['']))}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Close All
          </button>
          <button
            onClick={() => setExpandedFolders(new Set(folderPaths))}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Expand All
          </button>
        </div>
      </div>
      {renderNode(tree, 0, { current: 0 })}
    </div>
  );
}

interface FolderItemProps {
  name: string;
  path: string;
  isExpanded: boolean;
  hasChildren: boolean;
  depth: number;
  onToggle: () => void;
  isSelected: boolean;
  isPartiallySelected: boolean;
  onToggleSelect: () => void;
}

function FolderItem({
  name,
  isExpanded,
  hasChildren,
  depth,
  onToggle,
  isSelected,
  isPartiallySelected,
  onToggleSelect,
}: FolderItemProps) {
  return (
    <div
      className="flex items-center py-1 px-2 hover:bg-gray-50 rounded group"
      style={{ paddingLeft: `${depth * 20 + 8}px` }}
    >
      <div className="flex items-center space-x-2 flex-1">
        {/* Checkbox */}
        <div
          className="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          {isSelected && <Check className="h-3 w-3 text-blue-600" />}
          {isPartiallySelected && !isSelected && <Minus className="h-3 w-3 text-blue-600" />}
        </div>

        <div className="flex items-center space-x-2 flex-1 cursor-pointer" onClick={onToggle}>
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )
          ) : (
            <div className="w-4" />
          )}

          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}

          <span className="text-sm font-medium text-gray-700 select-none">{name}</span>
        </div>
      </div>
    </div>
  );
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  depth: number;
  isEvenRow: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onBookmarkClick?: (bookmark: Bookmark) => void;
}

function BookmarkItem({
  bookmark,
  depth,
  isEvenRow,
  isSelected,
  onToggleSelect,
  onBookmarkClick,
}: BookmarkItemProps) {
  return (
    <div
      className={`flex items-center py-2 px-2 group transition-colors border-b border-gray-100 ${
        isEvenRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'
      } ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-30' : ''}`}
      style={{ paddingLeft: `${depth * 20 + 8}px` }}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {/* Checkbox */}
        <div
          className="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          {isSelected && <Check className="h-3 w-3 text-blue-600" />}
        </div>

        <BookmarkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onBookmarkClick?.(bookmark)}>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900 truncate hover:text-blue-600 transition-colors">
              {bookmark.title || 'Untitled'}
            </span>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500 truncate flex-1">{bookmark.url}</p>
          </div>

          {bookmark.ai_summary && (
            <p className="text-xs text-gray-600 truncate mt-1">{bookmark.ai_summary}</p>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              bookmark.status === 'pending'
                ? 'bg-gray-100 text-gray-700'
                : bookmark.status === 'ai_analyzed'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {bookmark.status === 'ai_analyzed' ? 'AI Analyzed' : bookmark.status}
          </span>
        </div>
      </div>
    </div>
  );
}
