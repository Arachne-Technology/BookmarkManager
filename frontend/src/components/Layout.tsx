// Import React types and UI components

import { BookOpen, Settings } from 'lucide-react'; // Book icon for the application logo
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

// Layout component provides consistent application shell

/**
 * Props interface for the Layout component
 */
interface LayoutProps {
  children: ReactNode; // Content to be rendered within the layout
}

/**
 * Layout component provides the main application shell with header and content area
 * This wrapper component is used on all pages to maintain consistent styling and branding
 */
export function Layout({ children }: LayoutProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  // Determine settings URL - use sessionId if available, otherwise use a default route
  const settingsUrl = sessionId ? `/settings/${sessionId}` : '/settings';

  return (
    <div className="min-h-screen bg-gray-50">
      {' '}
      {/* Full-height container with light gray background */}
      {/* Application header with branding and navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {' '}
          {/* Responsive container with max width */}
          <div className="flex justify-between items-center py-4">
            {/* Left side: Application logo and title */}
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" /> {/* Application icon */}
              <h1 className="text-2xl font-bold text-gray-900">BookmarkParser</h1>
            </div>
            {/* Right side: Settings gear icon and tagline */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">AI-Powered Bookmark Management</div>
              {/* Settings gear icon positioned at far right */}
              <Link
                to={settingsUrl}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="AI Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Main content area where page-specific content is rendered */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children} {/* Render child components (pages) here */}
      </main>
    </div>
  );
}
