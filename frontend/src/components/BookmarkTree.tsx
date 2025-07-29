import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Folder, FolderOpen, Bookmark as BookmarkIcon } from 'lucide-react'
import { Bookmark } from '../services/api'

interface BookmarkTreeProps {
  bookmarks: Bookmark[]
}

interface TreeNode {
  name: string
  path: string
  type: 'folder' | 'bookmark'
  bookmark?: Bookmark
  children: TreeNode[]
  isExpanded?: boolean
}

export function BookmarkTree({ bookmarks }: BookmarkTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']))

  const { tree, folderPaths } = useMemo(() => {
    const root: TreeNode = { name: 'Root', path: '', type: 'folder', children: [] }
    const folderMap = new Map<string, TreeNode>()
    folderMap.set('', root)

    // Sort bookmarks by folder path and title for consistent display
    const sortedBookmarks = [...bookmarks].sort((a, b) => {
      if (a.folder_path !== b.folder_path) {
        return a.folder_path.localeCompare(b.folder_path)
      }
      return a.title.localeCompare(b.title)
    })

    sortedBookmarks.forEach(bookmark => {
      const folderPath = bookmark.folder_path || ''
      const pathParts = folderPath ? folderPath.split('/').filter(part => part.trim()) : []
      
      // Create folder structure
      let currentPath = ''
      let currentParent = root

      pathParts.forEach((part, index) => {
        const previousPath = currentPath
        currentPath = currentPath ? `${currentPath}/${part}` : part
        
        if (!folderMap.has(currentPath)) {
          const folderNode: TreeNode = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: []
          }
          folderMap.set(currentPath, folderNode)
          currentParent.children.push(folderNode)
        }
        
        currentParent = folderMap.get(currentPath)!
      })

      // Add bookmark to the appropriate folder
      const bookmarkNode: TreeNode = {
        name: bookmark.title || 'Untitled',
        path: `${folderPath}/${bookmark.title}`,
        type: 'bookmark',
        bookmark,
        children: []
      }
      
      currentParent.children.push(bookmarkNode)
    })

    return { tree: root, folderPaths: Array.from(folderMap.keys()) }
  }, [bookmarks])

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const renderNode = (node: TreeNode, depth: number = 0, bookmarkIndex: { current: number } = { current: 0 }) => {
    const isExpanded = expandedFolders.has(node.path)
    const hasChildren = node.children.length > 0

    if (node.type === 'bookmark') {
      const currentIndex = bookmarkIndex.current++
      return (
        <BookmarkItem
          key={node.path}
          bookmark={node.bookmark!}
          depth={depth}
          isEvenRow={currentIndex % 2 === 0}
        />
      )
    }

    // Skip rendering the root node
    if (node.path === '') {
      return (
        <div key="root">
          {node.children.map(child => renderNode(child, depth))}
        </div>
      )
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
        />
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1, bookmarkIndex))}
          </div>
        )}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No bookmarks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Bookmarks ({bookmarks.length})
        </h3>
        <button
          onClick={() => setExpandedFolders(new Set(folderPaths))}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Expand All
        </button>
      </div>
      {renderNode(tree, 0, { current: 0 })}
    </div>
  )
}

interface FolderItemProps {
  name: string
  path: string
  isExpanded: boolean
  hasChildren: boolean
  depth: number
  onToggle: () => void
}

function FolderItem({ name, isExpanded, hasChildren, depth, onToggle }: FolderItemProps) {
  return (
    <div 
      className="flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer rounded"
      style={{ paddingLeft: `${depth * 20 + 8}px` }}
      onClick={onToggle}
    >
      <div className="flex items-center space-x-2 flex-1">
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
        
        <span className="text-sm font-medium text-gray-700 select-none">
          {name}
        </span>
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: Bookmark
  depth: number
  isEvenRow: boolean
}

function BookmarkItem({ bookmark, depth, isEvenRow }: BookmarkItemProps) {
  return (
    <div 
      className={`flex items-center py-2 px-2 group transition-colors border-b border-gray-100 ${
        isEvenRow 
          ? 'bg-gray-50 hover:bg-gray-100' 
          : 'bg-white hover:bg-gray-50'
      }`}
      style={{ paddingLeft: `${depth * 20 + 28}px` }}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <BookmarkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900 truncate">
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
          
          <p className="text-xs text-gray-500 truncate">
            {bookmark.url}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-2 py-1 text-xs rounded-full ${
            bookmark.status === 'pending' 
              ? 'bg-gray-100 text-gray-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {bookmark.status}
          </span>
        </div>
      </div>
    </div>
  )
}