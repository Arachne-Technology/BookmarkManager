import {
  AlertTriangle,
  Calendar,
  Clock,
  Code,
  Copy,
  Database,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ExpertData {
  bookmark: {
    id: string;
    title: string;
    url: string;
    status: string;
    aiProvider: string;
    createdAt: string;
    updatedAt: string;
  };
  extraction: {
    method: string;
    metadata: {
      originalFileSize?: number;
      extractedLength: number;
      extractionTime?: number;
      attempts?: number;
      failedMethods?: string[];
    };
    extractedContent: string;
    contentLength: number;
    contentPreview: string;
  };
  aiAnalysis: {
    qualityScore?: number;
    qualityIssues: string[];
    requestData: {
      provider: string;
      timestamp: string;
      url: string;
      title: string;
      contentLength: number;
      prompt: string;
    };
    responseData: {
      shortSummary: string;
      longSummary: string;
      tags: string[];
      category: string;
      provider: string;
      confidence: number;
      qualityScore?: number;
      qualityIssues?: string[];
      timestamp: string;
      processingTimeMs?: number;
    };
  };
}

interface ExpertModeModalProps {
  bookmarkId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExpertModeModal({ bookmarkId, isOpen, onClose }: ExpertModeModalProps) {
  const [expertData, setExpertData] = useState<ExpertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'extraction' | 'ai' | 'content'>('extraction');

  useEffect(() => {
    if (isOpen && bookmarkId) {
      fetchExpertData();
    }
  }, [isOpen, bookmarkId]);

  const fetchExpertData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/expert/${bookmarkId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expert data');
      }
      const data = await response.json();
      setExpertData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expert data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Code className="h-6 w-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Expert Mode</h2>
              <p className="text-sm text-gray-500">Detailed extraction and AI analysis data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading expert data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchExpertData}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </button>
              </div>
            </div>
          ) : expertData ? (
            <>
              {/* Bookmark Info */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{expertData.bookmark.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Globe className="h-4 w-4 mr-2" />
                      <a
                        href={expertData.bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {expertData.bookmark.url}
                        <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Updated: {new Date(expertData.bookmark.updatedAt).toLocaleString()}
                      </div>
                      <div>Status: {expertData.bookmark.status}</div>
                      <div>Provider: {expertData.bookmark.aiProvider}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex px-6">
                  {[
                    { id: 'extraction', label: 'Content Extraction', icon: Database },
                    { id: 'ai', label: 'AI Analysis', icon: Code },
                    { id: 'content', label: 'Extracted Content', icon: Globe },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 ${
                        activeTab === id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'extraction' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Extraction Overview</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Extraction Method</div>
                          <div className="font-medium">{expertData.extraction.method}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Content Length</div>
                          <div className="font-medium">{formatBytes(expertData.extraction.contentLength)}</div>
                        </div>
                        {expertData.extraction.metadata.extractionTime && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Extraction Time</div>
                            <div className="font-medium">{formatDuration(expertData.extraction.metadata.extractionTime)}</div>
                          </div>
                        )}
                        {expertData.extraction.metadata.attempts && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Attempts</div>
                            <div className="font-medium">{expertData.extraction.metadata.attempts}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {expertData.extraction.metadata.failedMethods && expertData.extraction.metadata.failedMethods.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Failed Methods</h4>
                        <div className="flex flex-wrap gap-2">
                          {expertData.extraction.metadata.failedMethods.map((method, index) => (
                            <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Content Preview</h4>
                        <button
                          onClick={() => copyToClipboard(expertData.extraction.extractedContent, 'Content')}
                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Full Content
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {expertData.extraction.contentPreview}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">AI Analysis Quality</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Quality Score</div>
                          <div className="font-medium">
                            {expertData.aiAnalysis.qualityScore !== undefined ? 
                              `${(expertData.aiAnalysis.qualityScore * 100).toFixed(1)}%` : 
                              'Not available'
                            }
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Processing Time</div>
                          <div className="font-medium">
                            {expertData.aiAnalysis.responseData.processingTimeMs ? 
                              formatDuration(expertData.aiAnalysis.responseData.processingTimeMs) : 
                              'Not available'
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {expertData.aiAnalysis.qualityIssues.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Quality Issues</h4>
                        <div className="space-y-2">
                          {expertData.aiAnalysis.qualityIssues.map((issue, index) => (
                            <div key={index} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-yellow-800">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">AI Request Data</h4>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(expertData.aiAnalysis.requestData, null, 2), 'Request Data')}
                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy JSON
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-700 overflow-x-auto">
                          {JSON.stringify(expertData.aiAnalysis.requestData, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">AI Response Data</h4>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(expertData.aiAnalysis.responseData, null, 2), 'Response Data')}
                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy JSON
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm text-gray-700 overflow-x-auto">
                          {JSON.stringify(expertData.aiAnalysis.responseData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Full Extracted Content</h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {formatBytes(expertData.extraction.contentLength)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(expertData.extraction.extractedContent, 'Full Content')}
                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy All
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {expertData.extraction.extractedContent}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}