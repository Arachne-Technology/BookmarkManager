// Page component for managing bookmarks in a specific session
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { getSession, getBookmarks, Bookmark } from '../services/api'
import { BookmarkTree } from '../components/BookmarkTree'
import { SessionInfo } from '../components/SessionInfo'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { FloatingActionMenu } from '../components/FloatingActionMenu'
import { BookmarkDetailPane } from '../components/BookmarkDetailPane'

export function BookmarkPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [selectedBookmarks, setSelectedBookmarks] = useState<Bookmark[]>([])
  const [detailPaneBookmark, setDetailPaneBookmark] = useState<Bookmark | null>(null)
  
  const { data: session, isLoading: sessionLoading } = useQuery(
    ['session', sessionId],
    () => getSession(sessionId!),
    { enabled: !!sessionId }
  )
  
  const { data: bookmarksData, isLoading: bookmarksLoading, refetch: refetchBookmarks } = useQuery(
    ['bookmarks', sessionId],
    () => getBookmarks(sessionId!),
    { enabled: !!sessionId }
  )
  
  if (sessionLoading || bookmarksLoading) {
    return <LoadingSpinner />
  }
  
  if (!session || !bookmarksData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Session not found</p>
      </div>
    )
  }
  
  const handleSelectionChange = (selected: Bookmark[]) => {
    setSelectedBookmarks(selected)
  }

  const handleClearSelection = () => {
    setSelectedBookmarks([])
  }

  const handleProcessingStarted = () => {
    // Refresh bookmarks data to show processing status
    refetchBookmarks()
  }

  const handleBookmarkClick = (bookmark: Bookmark) => {
    setDetailPaneBookmark(bookmark)
  }

  const handleDetailPaneClose = () => {
    setDetailPaneBookmark(null)
  }

  return (
    <div className={`space-y-6 ${detailPaneBookmark ? 'mr-96' : ''} transition-all duration-300`}>
      <SessionInfo session={session} />
      <BookmarkTree 
        bookmarks={bookmarksData.bookmarks} 
        onSelectionChange={handleSelectionChange}
        onBookmarkClick={handleBookmarkClick}
      />
      
      <FloatingActionMenu
        selectedBookmarks={selectedBookmarks}
        onClearSelection={handleClearSelection}
        onProcessingStarted={handleProcessingStarted}
      />

      {detailPaneBookmark && (
        <BookmarkDetailPane
          bookmark={detailPaneBookmark}
          isOpen={!!detailPaneBookmark}
          onClose={handleDetailPaneClose}
        onReanalyze={(bookmarkId) => {
          // TODO: Implement reanalyze functionality
          console.log('Reanalyzing bookmark:', bookmarkId)
        }}
        onDelete={(bookmarkId) => {
          // TODO: Implement delete functionality
          console.log('Deleting bookmark:', bookmarkId)
        }}
        onMove={(bookmarkId) => {
          // TODO: Implement move functionality
          console.log('Moving bookmark:', bookmarkId)
        }}
        />
      )}
    </div>
  )
}