// Import React Router components for client-side navigation
import { Route, Routes } from 'react-router-dom';
// Import application components
import { Layout } from './components/Layout';
import { BookmarkPage } from './pages/BookmarkPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Main App component that defines the application routing structure
 * Uses React Router to handle navigation between different views
 */
function App() {
  return (
    <Layout>
      {/* Define application routes */}
      <Routes>
        {/* Home page: file upload interface */}
        <Route path="/" element={<HomePage />} />
        {/* Bookmark management page: displays parsed bookmarks for a specific session */}
        <Route path="/bookmarks/:sessionId" element={<BookmarkPage />} />
        {/* Settings page: AI provider configuration */}
        <Route path="/settings/:sessionId" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
