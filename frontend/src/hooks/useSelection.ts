import { useCallback, useMemo, useState } from 'react';
import type { Bookmark } from '../services/api';

export interface SelectionState {
  selectedBookmarks: Set<string>;
  selectedFolders: Set<string>;
}

export function useSelection(bookmarks: Bookmark[]) {
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

  // Create folder structure for easier traversal
  const folderStructure = useMemo(() => {
    const structure = new Map<string, string[]>(); // folder path -> bookmark IDs
    const folderHierarchy = new Map<string, string[]>(); // parent folder -> child folders

    bookmarks.forEach((bookmark) => {
      const folderPath = bookmark.folder_path || '';
      if (!structure.has(folderPath)) {
        structure.set(folderPath, []);
      }
      structure.get(folderPath)!.push(bookmark.id);

      // Build folder hierarchy
      if (folderPath) {
        const pathParts = folderPath.split('/').filter((part) => part.trim());
        let currentPath = '';

        pathParts.forEach((part) => {
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!folderHierarchy.has(parentPath)) {
            folderHierarchy.set(parentPath, []);
          }
          if (!folderHierarchy.get(parentPath)!.includes(currentPath)) {
            folderHierarchy.get(parentPath)!.push(currentPath);
          }
        });
      }
    });

    return { structure, folderHierarchy };
  }, [bookmarks]);

  const getBookmarksInFolder = useCallback(
    (folderPath: string): string[] => {
      const bookmarkIds: string[] = [];

      // Get direct bookmarks in this folder
      const directBookmarks = folderStructure.structure.get(folderPath) || [];
      bookmarkIds.push(...directBookmarks);

      // Get bookmarks in subfolders recursively
      const getSubfolderBookmarks = (path: string) => {
        const subfolders = folderStructure.folderHierarchy.get(path) || [];
        subfolders.forEach((subfolder) => {
          const subBookmarks = folderStructure.structure.get(subfolder) || [];
          bookmarkIds.push(...subBookmarks);
          getSubfolderBookmarks(subfolder);
        });
      };

      getSubfolderBookmarks(folderPath);
      return bookmarkIds;
    },
    [folderStructure]
  );

  const isBookmarkSelected = useCallback(
    (bookmarkId: string): boolean => {
      return selectedBookmarks.has(bookmarkId);
    },
    [selectedBookmarks]
  );

  const isFolderSelected = useCallback(
    (folderPath: string): boolean => {
      const bookmarksInFolder = getBookmarksInFolder(folderPath);
      return (
        bookmarksInFolder.length > 0 && bookmarksInFolder.every((id) => selectedBookmarks.has(id))
      );
    },
    [selectedBookmarks, getBookmarksInFolder]
  );

  const isFolderPartiallySelected = useCallback(
    (folderPath: string): boolean => {
      const bookmarksInFolder = getBookmarksInFolder(folderPath);
      return (
        bookmarksInFolder.some((id) => selectedBookmarks.has(id)) &&
        !bookmarksInFolder.every((id) => selectedBookmarks.has(id))
      );
    },
    [selectedBookmarks, getBookmarksInFolder]
  );

  const toggleBookmark = useCallback((bookmarkId: string) => {
    setSelectedBookmarks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  }, []);

  const toggleFolder = useCallback(
    (folderPath: string) => {
      const bookmarksInFolder = getBookmarksInFolder(folderPath);
      const isCurrentlySelected = isFolderSelected(folderPath);

      setSelectedBookmarks((prev) => {
        const newSet = new Set(prev);

        if (isCurrentlySelected) {
          // Deselect all bookmarks in folder
          bookmarksInFolder.forEach((id) => newSet.delete(id));
        } else {
          // Select all bookmarks in folder
          bookmarksInFolder.forEach((id) => newSet.add(id));
        }

        return newSet;
      });
    },
    [getBookmarksInFolder, isFolderSelected]
  );

  const selectAll = useCallback(() => {
    setSelectedBookmarks(new Set(bookmarks.map((b) => b.id)));
  }, [bookmarks]);

  const clearSelection = useCallback(() => {
    setSelectedBookmarks(new Set());
    setSelectedFolders(new Set());
  }, []);

  const getSelectedBookmarks = useCallback((): Bookmark[] => {
    return bookmarks.filter((bookmark) => selectedBookmarks.has(bookmark.id));
  }, [bookmarks, selectedBookmarks]);

  const selectedCount = selectedBookmarks.size;

  return {
    selectedBookmarks,
    selectedFolders,
    selectedCount,
    isBookmarkSelected,
    isFolderSelected,
    isFolderPartiallySelected,
    toggleBookmark,
    toggleFolder,
    selectAll,
    clearSelection,
    getSelectedBookmarks,
  };
}
