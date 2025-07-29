import { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Brain, 
  Trash2, 
  FolderOpen, 
  RefreshCw,
  Tag,
  Calendar,
  Globe,
  Loader2
} from 'lucide-react';
import { Bookmark } from '../services/api';
import { toast } from 'react-hot-toast';

interface BookmarkDetailPaneProps {
  bookmark: Bookmark;
  isOpen: boolean;
  onClose: () => void;
  onReanalyze?: (bookmarkId: string) => void;
  onDelete?: (bookmarkId: string) => void;
  onMove?: (bookmarkId: string) => void;
}

export function BookmarkDetailPane({ 
  bookmark, 
  isOpen, 
  onClose,
  onReanalyze,
  onDelete,
  onMove 
}: BookmarkDetailPaneProps) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleReanalyze = async () => {
    if (!onReanalyze) return;
    
    setIsReanalyzing(true);
    try {
      await onReanalyze(bookmark.id);
      toast.success('Reanalysis started');
    } catch (error) {
      toast.error('Failed to start reanalysis');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete this bookmark?')) {
      onDelete(bookmark.id);
      onClose();
    }
  };

  const handleMove = () => {
    if (!onMove) return;
    
    // TODO: Implement folder selection modal
    toast('Move functionality coming soon');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Bookmark Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Basic Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900 leading-5">
                {bookmark.title || 'Untitled Bookmark'}
              </h3>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 break-all flex items-center mt-1"
              >
                <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                {bookmark.url}
                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
              </a>
            </div>

            {bookmark.folder_path && (
              <div className="flex items-center text-sm text-gray-600">
                <FolderOpen className="h-4 w-4 mr-1" />
                <span className="truncate">{bookmark.folder_path}</span>
              </div>
            )}

            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Added {new Date(bookmark.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Brain className="h-4 w-4 mr-2 text-blue-500" />
              AI Analysis
            </h4>
            {bookmark.ai_summary && (
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 disabled:opacity-50"
              >
                {isReanalyzing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span>Reanalyze</span>
              </button>
            )}
          </div>

          {bookmark.ai_summary ? (
            <div className="space-y-3">
              {/* Provider Info */}
              {bookmark.ai_provider && (
                <div className="text-xs text-gray-500">
                  Analyzed by {bookmark.ai_provider.charAt(0).toUpperCase() + bookmark.ai_provider.slice(1)}
                </div>
              )}

              {/* Short Summary */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Summary</h5>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {bookmark.ai_summary}
                </p>
              </div>

              {/* Long Summary */}
              {bookmark.ai_long_summary && bookmark.ai_long_summary !== bookmark.ai_summary && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Detailed Analysis</h5>
                  <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                    {bookmark.ai_long_summary.split('\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index}>{paragraph.trim()}</p>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {bookmark.ai_tags && bookmark.ai_tags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    Tags
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {bookmark.ai_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              {bookmark.ai_category && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Category</h5>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {bookmark.ai_category}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">
                This bookmark hasn't been analyzed yet
              </p>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
              >
                {isReanalyzing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3 mr-1" />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Screenshot Section */}
        {bookmark.screenshot && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Website Preview</h4>
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={`data:image/png;base64,${bookmark.screenshot}`}
                alt="Website screenshot"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
          <div className="space-y-2">
            <button
              onClick={handleMove}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
            >
              <FolderOpen className="h-4 w-4 text-green-500" />
              <span>Move to Folder</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Delete Bookmark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}