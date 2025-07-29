import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, Trash2, FolderOpen, X, Settings, Loader2, AlertTriangle } from 'lucide-react';
import { Bookmark, processBookmarks } from '../services/api';
import { toast } from 'react-hot-toast';

interface FloatingActionMenuProps {
  selectedBookmarks: Bookmark[];
  onClearSelection: () => void;
  onProcessingStarted?: () => void;
}

export function FloatingActionMenu({ 
  selectedBookmarks, 
  onClearSelection,
  onProcessingStarted 
}: FloatingActionMenuProps) {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (selectedBookmarks.length === 0) {
    return null;
  }

  const handleAnalyzeWithAI = async () => {
    setIsProcessing(true);
    try {
      const bookmarkIds = selectedBookmarks.map(b => b.id);
      await processBookmarks(bookmarkIds);
      
      toast.success(`Started AI analysis for ${selectedBookmarks.length} bookmarks`);
      onClearSelection();
      
      if (onProcessingStarted) {
        onProcessingStarted();
      }
    } catch (error) {
      console.error('Error starting AI analysis:', error);
      toast.error('Failed to start AI analysis. Please check your settings.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    try {
      // TODO: Implement delete functionality
      toast.success(`${selectedBookmarks.length} bookmarks deleted`);
      onClearSelection();
      setShowConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting bookmarks:', error);
      toast.error('Failed to delete bookmarks');
    }
  };

  const handleMove = () => {
    // TODO: Implement move functionality
    toast('Move functionality coming soon');
  };

  return (
    <>
      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              {selectedBookmarks.length} bookmark{selectedBookmarks.length !== 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={onClearSelection}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* AI Analysis Button */}
            <button
              onClick={handleAnalyzeWithAI}
              disabled={isProcessing}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 text-blue-500" />
              )}
              <span>Analyze with AI</span>
            </button>

            {/* Move Button */}
            <button
              onClick={handleMove}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
            >
              <FolderOpen className="h-4 w-4 text-green-500" />
              <span>Move to Folder</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Delete</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Settings Link */}
            <button
              onClick={() => {
                if (sessionId) {
                  navigate(`/settings/${sessionId}`)
                }
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-md transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>AI Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Delete
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete {selectedBookmarks.length} bookmark{selectedBookmarks.length !== 1 ? 's' : ''}?
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}