// Page component for managing bookmarks in a specific session
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookmarkDetailPane } from '../components/BookmarkDetailPane';
import { BookmarkTree } from '../components/BookmarkTree';
import { ExpertModeModal } from '../components/ExpertModeModal';
import { FloatingActionMenu } from '../components/FloatingActionMenu';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SessionInfo } from '../components/SessionInfo';
import { type Bookmark, getBookmarks, getSession, processBookmarks } from '../services/api';

export function BookmarkPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [selectedBookmarks, setSelectedBookmarks] = useState<Bookmark[]>([]);
  const [detailPaneBookmark, setDetailPaneBookmark] = useState<Bookmark | null>(null);
  const [expertModeBookmarkId, setExpertModeBookmarkId] = useState<string | null>(null);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId
  });

  const {
    data: bookmarksData,
    isLoading: bookmarksLoading,
    refetch: refetchBookmarks,
  } = useQuery({
    queryKey: ['bookmarks', sessionId],
    queryFn: () => getBookmarks(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 3000, // Poll every 3 seconds to catch AI updates
    refetchIntervalInBackground: true
  });

  if (sessionLoading || bookmarksLoading) {
    return <LoadingSpinner />;
  }

  if (!session || !bookmarksData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Session not found</p>
      </div>
    );
  }

  const handleSelectionChange = (selected: Bookmark[]) => {
    setSelectedBookmarks(selected);
  };

  const handleClearSelection = () => {
    setSelectedBookmarks([]);
  };

  const handleProcessingStarted = () => {
    // Refresh bookmarks data to show processing status
    refetchBookmarks();
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    setDetailPaneBookmark(bookmark);
  };

  const handleDetailPaneClose = () => {
    setDetailPaneBookmark(null);
  };

  const handleExpertMode = (bookmarkId: string) => {
    setExpertModeBookmarkId(bookmarkId);
  };

  const handleExpertModeClose = () => {
    setExpertModeBookmarkId(null);
  };

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
          onReanalyze={async (bookmarkId) => {
            try {
              const result = await processBookmarks([bookmarkId]);
              const bookmark = bookmarksData.bookmarks.find(b => b.id === bookmarkId);
              const hasBeenAnalyzed = bookmark?.ai_summary;
              
              toast.success(
                hasBeenAnalyzed 
                  ? `Started re-analysis of bookmark. Job ID: ${result.jobIds[0]}`
                  : `Started analysis of bookmark. Job ID: ${result.jobIds[0]}`
              );
              // Refetch bookmarks to update the UI
              refetchBookmarks();
            } catch (error) {
              console.error('Failed to start analysis:', error);
              const bookmark = bookmarksData.bookmarks.find(b => b.id === bookmarkId);
              const hasBeenAnalyzed = bookmark?.ai_summary;
              toast.error(
                hasBeenAnalyzed
                  ? 'Failed to start re-analysis. Please try again.'
                  : 'Failed to start analysis. Please try again.'
              );
            }
          }}
          onDelete={(bookmarkId) => {
            // TODO: Implement delete functionality
            console.log('Deleting bookmark:', bookmarkId);
          }}
          onMove={(bookmarkId) => {
            // TODO: Implement move functionality
            console.log('Moving bookmark:', bookmarkId);
          }}
          onExpertMode={handleExpertMode}
        />
      )}

      {expertModeBookmarkId && (
        <ExpertModeModal
          bookmarkId={expertModeBookmarkId}
          isOpen={!!expertModeBookmarkId}
          onClose={handleExpertModeClose}
        />
      )}
    </div>
  );
}
