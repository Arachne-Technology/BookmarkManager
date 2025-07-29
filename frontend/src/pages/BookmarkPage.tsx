// Page component for managing bookmarks in a specific session
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { getSession, getBookmarks } from '../services/api'
import { BookmarkTree } from '../components/BookmarkTree'
import { SessionInfo } from '../components/SessionInfo'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function BookmarkPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  
  const { data: session, isLoading: sessionLoading } = useQuery(
    ['session', sessionId],
    () => getSession(sessionId!),
    { enabled: !!sessionId }
  )
  
  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery(
    ['bookmarks', sessionId],
    () => getBookmarks(sessionId!, { limit: 100 }),
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
  
  return (
    <div className="space-y-6">
      <SessionInfo session={session} />
      <BookmarkTree bookmarks={bookmarksData.bookmarks} />
    </div>
  )
}