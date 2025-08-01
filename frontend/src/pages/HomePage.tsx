// Home page component with file upload interface
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileUpload } from '../components/FileUpload';
import { getUserPreferences } from '../services/api';

export function HomePage() {
  // Check if AI is configured
  const { data: preferences } = useQuery({
    queryKey: ['preferences', 'global'],
    queryFn: () => getUserPreferences(),
  });

  const isAIConfigured = preferences?.hasApiKey && preferences?.model;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Bookmark File</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your browser's bookmark export file and let AI help you organize and clean up your
          collection. Supports Chrome, Firefox, Safari, and Edge exports.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* AI Settings Notice - only show if not configured */}
        {!isAIConfigured && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900">Configure AI Settings</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Set up your AI provider (Claude or OpenAI) before uploading to enable AI-powered bookmark analysis.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Configure AI Settings →
                </Link>
              </div>
            </div>
          </div>
        )}

        <FileUpload />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">1. Upload</h3>
            <p className="text-gray-600">Upload your browser's bookmark HTML export file</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">2. Review</h3>
            <p className="text-gray-600">Browse your bookmarks in an organized interface</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">3. Export</h3>
            <p className="text-gray-600">Download your cleaned and organized bookmark file</p>
          </div>
        </div>
      </div>
    </div>
  );
}
