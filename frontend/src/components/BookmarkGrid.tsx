// Component for displaying bookmarks in a grid layout
import { ExternalLink, Folder } from 'lucide-react';
import type { Bookmark } from '../services/api';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
}

export function BookmarkGrid({ bookmarks }: BookmarkGridProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No bookmarks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Bookmarks ({bookmarks.length})</h3>
      </div>

      <div className="grid gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    </div>
  );
}

interface BookmarkCardProps {
  bookmark: Bookmark;
}

function BookmarkCard({ bookmark }: BookmarkCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {bookmark.title || 'Untitled'}
            </h4>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <p className="text-xs text-gray-500 truncate mb-2">{bookmark.url}</p>

          {bookmark.folder_path && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Folder className="h-3 w-3" />
              <span>{bookmark.folder_path}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
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
