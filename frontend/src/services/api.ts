import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
})

export interface UploadResponse {
  sessionId: string
  message: string
  bookmarksCount: number
}

export interface Bookmark {
  id: string
  session_id: string
  title: string
  url: string
  folder_path: string
  original_index: number
  status: string
  is_accessible: boolean
  selected_for_analysis: boolean
  created_at: string
  updated_at: string
}

export interface BookmarksResponse {
  bookmarks: Bookmark[]
  total: number
  limit: number
  offset: number
}

export interface Session {
  id: string
  created_at: string
  expires_at: string
  file_name: string
  original_count: number
  processed_count: number
  status: string
}

export async function uploadBookmarkFile(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('bookmarkFile', file)
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

export async function getSession(sessionId: string): Promise<Session> {
  const response = await api.get<Session>(`/sessions/${sessionId}`)
  return response.data
}

export async function getBookmarks(
  sessionId: string, 
  params?: { status?: string; limit?: number; offset?: number }
): Promise<BookmarksResponse> {
  const response = await api.get<BookmarksResponse>('/bookmarks', {
    params: {
      sessionId,
      ...params
    }
  })
  return response.data
}

export async function updateBookmark(
  bookmarkId: string, 
  updates: { status?: string; selected_for_analysis?: boolean }
): Promise<Bookmark> {
  const response = await api.put<Bookmark>(`/bookmarks/${bookmarkId}`, updates)
  return response.data
}

export async function exportBookmarks(
  sessionId: string,
  filters?: { status?: string; includeDeleted?: boolean }
): Promise<Blob> {
  const response = await api.post('/export', {
    sessionId,
    filters
  }, {
    responseType: 'blob'
  })
  
  return response.data
}