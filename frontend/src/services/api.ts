import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

export interface UploadResponse {
  sessionId: string;
  message: string;
  bookmarksCount: number;
}

export interface Bookmark {
  id: string;
  session_id: string;
  title: string;
  url: string;
  folder_path: string;
  original_index: number;
  status: string;
  is_accessible: boolean;
  selected_for_analysis: boolean;
  ai_summary?: string;
  ai_long_summary?: string;
  ai_tags?: string[];
  ai_category?: string;
  ai_provider?: string;
  screenshot?: ArrayBuffer;
  created_at: string;
  updated_at: string;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  total: number;
  limit: number;
  offset: number;
}

export interface Session {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string;
  original_count: number;
  processed_count: number;
  status: string;
}

export async function uploadBookmarkFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('bookmarkFile', file);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function getSession(sessionId: string): Promise<Session> {
  const response = await api.get<Session>(`/sessions/${sessionId}`);
  return response.data;
}

export async function getBookmarks(
  sessionId: string,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<BookmarksResponse> {
  const response = await api.get<BookmarksResponse>('/bookmarks', {
    params: {
      sessionId,
      ...params,
    },
  });
  return response.data;
}

export async function updateBookmark(
  bookmarkId: string,
  updates: { status?: string; selected_for_analysis?: boolean }
): Promise<Bookmark> {
  const response = await api.put<Bookmark>(`/bookmarks/${bookmarkId}`, updates);
  return response.data;
}

export async function exportBookmarks(
  sessionId: string,
  filters?: { status?: string; includeDeleted?: boolean }
): Promise<Blob> {
  const response = await api.post(
    '/export',
    {
      sessionId,
      filters,
    },
    {
      responseType: 'blob',
    }
  );

  return response.data;
}

// AI-related interfaces and functions
export interface AIProvider {
  id: string;
  name: string;
  configured: boolean;
}

export interface AIJob {
  id: string;
  bookmarkId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface UserPreferences {
  provider: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  hasApiKey?: boolean;
}

// AI API functions
export async function getAIProviders(): Promise<{ providers: string[] }> {
  const response = await api.get<{ providers: string[] }>('/ai/providers');
  return response.data;
}

export async function configureAIProvider(config: {
  provider: string;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ success: boolean }> {
  const response = await api.post<{ success: boolean }>('/ai/providers/configure', config);
  return response.data;
}

export async function processBookmarks(
  bookmarkIds: string[],
  provider?: string
): Promise<{ jobIds: string[]; message: string }> {
  const response = await api.post<{ jobIds: string[]; message: string }>('/ai/process', {
    bookmarkIds,
    provider,
  });
  return response.data;
}

export async function getAIJobStatus(jobId: string): Promise<AIJob> {
  const response = await api.get<AIJob>(`/ai/jobs/${jobId}`);
  return response.data;
}

export async function getAIQueueStatus(): Promise<Record<string, number>> {
  const response = await api.get<Record<string, number>>('/ai/queue');
  return response.data;
}

// Settings API functions
export async function getUserPreferences(sessionId?: string): Promise<UserPreferences> {
  const endpoint = sessionId ? `/settings/${sessionId}` : '/settings/global';
  const response = await api.get<UserPreferences>(endpoint);
  return response.data;
}

export async function updateUserPreferences(
  sessionId: string | undefined,
  preferences: Partial<UserPreferences & { apiKey?: string }>
): Promise<{ success: boolean; message: string }> {
  const endpoint = sessionId ? `/settings/${sessionId}` : '/settings';
  const response = await api.put<{ success: boolean; message: string }>(
    endpoint,
    preferences
  );
  return response.data;
}

export async function testAPIKey(
  sessionId: string | undefined,
  provider: string,
  apiKey: string
): Promise<{ isValid: boolean; message: string }> {
  const endpoint = sessionId ? `/settings/${sessionId}/test` : '/settings/test';
  const response = await api.post<{ isValid: boolean; message: string }>(
    endpoint,
    { provider, apiKey }
  );
  return response.data;
}

export async function getAvailableModels(
  provider: string,
  apiKey?: string
): Promise<{ models: { id: string; name: string; description?: string }[]; message?: string }> {
  if (apiKey) {
    // Use POST with API key for dynamic fetching
    const response = await api.post<{
      models: { id: string; name: string; description?: string }[];
      error?: string;
    }>(`/settings/models/${provider}`, { apiKey });
    return response.data;
  } else {
    // Use GET with environment API keys as fallback
    const response = await api.get<{
      models: { id: string; name: string; description?: string }[];
      message?: string;
    }>(`/settings/models/${provider}`);
    return response.data;
  }
}
