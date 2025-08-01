import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Check,
  Info,
  Key,
  Loader2,
  Settings,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAIProviders,
  getAvailableModels,
  getUserPreferences,
  testAPIKey,
  type UserPreferences,
  updateUserPreferences,
} from '../services/api';

export function SettingsPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    provider: 'claude',
    apiKey: '',
    model: '',
    maxTokens: 1000,
    temperature: 0.7,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeyPlaceholder, setIsApiKeyPlaceholder] = useState(false);
  const [apiKeyTest, setApiKeyTest] = useState<{
    testing: boolean;
    result?: { isValid: boolean; message: string };
  }>({
    testing: false,
  });

  // Load user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['preferences', sessionId || 'global'],
    queryFn: () => getUserPreferences(sessionId),
  });

  // Load available providers
  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: getAIProviders
  });

  // Load available models for selected provider
  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['models', formData.provider],
    queryFn: () => getAvailableModels(formData.provider, formData.apiKey || undefined),
    enabled: false, // Disable automatic fetching
    retry: false, // Don't retry failed model requests
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences & { apiKey?: string }>) =>
      updateUserPreferences(sessionId, data),
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['preferences', sessionId || 'global'] });
    },
    onError: (error: any) => {
      toast.error('Failed to save settings');
      console.error('Settings update error:', error);
    },
  });

  // Test API key mutation
  const testApiKeyMutation = useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      testAPIKey(sessionId, provider, apiKey),
    onSuccess: (result) => {
      setApiKeyTest({ testing: false, result });
      if (result.isValid) {
        toast.success('API key is valid!');
      } else {
        toast.error(result.message);
      }
    },
      onError: (error: any) => {
        setApiKeyTest({ testing: false, result: { isValid: false, message: 'Test failed' } });
        toast.error('Failed to test API key');
        console.error('API key test error:', error);
      },
    }
  );

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      const hasExistingKey = !!preferences.hasApiKey;
      setFormData({
        provider: preferences.provider || 'claude',
        apiKey: hasExistingKey ? '•••••••••••••••••••••••••••••••' : '', // Show dots if API key exists
        model: preferences.model || '',
        maxTokens: preferences.maxTokens || 1000,
        temperature: preferences.temperature || 0.7,
      });
      setIsApiKeyPlaceholder(hasExistingKey);
      
      // Fetch models if we have an existing API key
      if (hasExistingKey) {
        setTimeout(() => refetchModels(), 100);
      }
    }
  }, [preferences, refetchModels]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear API key test result when changing provider or key
    if (field === 'provider' || field === 'apiKey') {
      setApiKeyTest({ testing: false });
      // If user starts typing in API key field, clear placeholder state
      if (field === 'apiKey') {
        setIsApiKeyPlaceholder(false);
      }
      // Fetch models when provider changes (if we have an API key)
      if (field === 'provider' && formData.apiKey && !isApiKeyPlaceholder) {
        setTimeout(() => refetchModels(), 100);
      }
    }
  };

  const handleTestApiKey = () => {
    if (!formData.provider || !formData.apiKey || isApiKeyPlaceholder) {
      toast.error('Please select a provider and enter an API key');
      return;
    }

    setApiKeyTest({ testing: true });
    testApiKeyMutation.mutate({
      provider: formData.provider,
      apiKey: formData.apiKey,
    });
  };

  const handleApiKeyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.apiKey && formData.apiKey.length > 10 && !isApiKeyPlaceholder) {
      refetchModels();
    }
  };

  const handleSave = () => {
    const dataToSave = { ...formData };
    // Don't save the placeholder dots - send empty string to keep existing key
    if (isApiKeyPlaceholder) {
      dataToSave.apiKey = '';
    }
    updatePreferencesMutation.mutate(dataToSave);
  };

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        {sessionId ? (
          <button
            onClick={() => navigate(`/bookmarks/${sessionId}`)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Bookmarks
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </button>
        )}

        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sessionId ? 'Session AI Settings' : 'Global AI Settings'}
            </h1>
            <p className="text-sm text-gray-600">
              {sessionId 
                ? 'Configure AI providers for this bookmark session' 
                : 'Configure your default AI providers and preferences'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      {preferences?.hasApiKey && preferences?.model && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-900">AI Provider Configured</h4>
              <p className="text-sm text-green-700">
                {preferences.provider === 'claude' ? 'Anthropic Claude' : 'OpenAI GPT'} is configured with model {preferences.model}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-500" />
            AI Provider Configuration
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <div className="relative">
              <select
                value={formData.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="claude">
                  Anthropic Claude {formData.provider === 'claude' && preferences?.hasApiKey ? '✓' : ''}
                </option>
                <option value="openai">
                  OpenAI GPT {formData.provider === 'openai' && preferences?.hasApiKey ? '✓' : ''}
                </option>
              </select>
              {preferences?.hasApiKey && formData.provider && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-8">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Choose your preferred AI provider for bookmark analysis
              {preferences?.hasApiKey && (
                <span className="text-green-600 ml-1">• API key configured</span>
              )}
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                onKeyDown={handleApiKeyKeyDown}
                placeholder={
                  isApiKeyPlaceholder 
                    ? 'API key is configured (click to replace)' 
                    : `Enter your ${formData.provider === 'claude' ? 'Claude' : 'OpenAI'} API key (press Enter to load models)`
                }
                className={`w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  isApiKeyPlaceholder ? 'text-gray-500 italic' : ''
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <X className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                </button>
                {formData.apiKey && !isApiKeyPlaceholder && (
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={apiKeyTest.testing}
                    className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  >
                    {apiKeyTest.testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Placeholder Info */}
            {isApiKeyPlaceholder && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                <Info className="h-4 w-4" />
                <span>API key is saved from previous session. Start typing to replace it.</span>
              </div>
            )}

            {/* API Key Test Result */}
            {apiKeyTest.result && (
              <div
                className={`mt-2 flex items-center space-x-2 text-sm ${
                  apiKeyTest.result.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {apiKeyTest.result.isValid ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>{apiKeyTest.result.message}</span>
              </div>
            )}

            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Getting API Keys:</p>
                  {formData.provider === 'claude' ? (
                    <p>
                      Get your Claude API key from{' '}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        console.anthropic.com
                      </a>
                    </p>
                  ) : (
                    <p>
                      Get your OpenAI API key from{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        platform.openai.com
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Environment Configuration Status */}
          {providersData?.providers && providersData.providers.length > 0 && (
            <div className="p-3 bg-green-50 rounded-md">
              <div className="flex items-start space-x-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-700">
                  <p className="font-medium mb-1">Environment Configuration Detected:</p>
                  <p>
                    The following AI providers are pre-configured from environment variables: {' '}
                    <span className="font-semibold">
                      {providersData.providers.map(provider => 
                        provider === 'claude' ? 'Anthropic Claude' : 
                        provider === 'openai' ? 'OpenAI GPT' : provider
                      ).join(', ')}
                    </span>
                  </p>
                  <p className="mt-1 text-xs">
                    You can use these providers immediately, or configure different API keys below for this session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              disabled={!modelsData?.models || modelsData.models.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {modelsData?.models && modelsData.models.length > 0
                  ? 'Select a model...'
                  : 'No models available'}
              </option>
              {modelsData?.models?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.description && `- ${model.description}`}
                </option>
              ))}
            </select>
            {modelsData?.message && (
              <p className="mt-1 text-xs text-gray-500">{modelsData.message}</p>
            )}
            {!formData.apiKey && (
              <p className="mt-1 text-xs text-blue-600">
                💡 Enter your API key above to see available models
              </p>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Settings</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={formData.maxTokens}
                  onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Maximum response length</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    handleInputChange('temperature', parseFloat(e.target.value) || 0.7)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Response creativity (0 = focused, 1 = creative)
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updatePreferencesMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
