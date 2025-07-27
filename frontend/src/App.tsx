import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { BookmarkPage } from './pages/BookmarkPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bookmarks/:sessionId" element={<BookmarkPage />} />
      </Routes>
    </Layout>
  )
}

export default App