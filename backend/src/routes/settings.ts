import crypto from 'crypto';
import { Router } from 'express';
import { ClaudeProvider } from '../ai/providers/ClaudeProvider';
import { OpenAIProvider } from '../ai/providers/OpenAIProvider';
import { getDatabase } from '../utils/database';
import { modelCache } from '../utils/modelCache';

const router = Router();

// Simple encryption for storing API keys (in production, use proper encryption)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'bookmark-parser-key-2024-32chars!!';

function encrypt(text: string): string {
  try {
    const cipher = crypto.createCipher('aes256', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // fallback to plain text for development
  }
}

// Decrypt function - uncomment if needed for future use
/*
function decrypt(text: string): string {
  try {
    const decipher = crypto.createDecipher('aes256', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // fallback to plain text for development
  }
}
*/

// Get user preferences for a session
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const db = getDatabase();

    const result = await db.query(
      'SELECT provider, model, max_tokens, temperature FROM user_preferences WHERE session_id = $1',
      [sessionId]
    );

    const preferences = result.rows[0] || {
      provider: process.env.DEFAULT_AI_PROVIDER || 'claude',
      model: null,
      max_tokens: 1000,
      temperature: 0.7,
    };

    res.json(preferences);
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Update user preferences
router.put('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { provider, apiKey, model, maxTokens, temperature } = req.body;
    const db = getDatabase();

    // Check if preferences exist
    const existingResult = await db.query('SELECT id FROM user_preferences WHERE session_id = $1', [
      sessionId,
    ]);

    const encryptedApiKey = apiKey ? encrypt(apiKey) : null;

    if (existingResult.rows.length > 0) {
      // Update existing preferences
      await db.query(
        `UPDATE user_preferences SET 
         provider = COALESCE($1, provider),
         api_key_encrypted = COALESCE($2, api_key_encrypted),
         model = COALESCE($3, model),
         max_tokens = COALESCE($4, max_tokens),
         temperature = COALESCE($5, temperature),
         updated_at = NOW()
         WHERE session_id = $6`,
        [provider, encryptedApiKey, model, maxTokens, temperature, sessionId]
      );
    } else {
      // Create new preferences
      await db.query(
        `INSERT INTO user_preferences (session_id, provider, api_key_encrypted, model, max_tokens, temperature)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, provider, encryptedApiKey, model, maxTokens, temperature]
      );
    }

    res.json({ success: true, message: 'Preferences updated successfully' });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Test API key
router.post('/:sessionId/test', async (req, res, next) => {
  try {
    const { sessionId: _sessionId } = req.params;
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    // Simple validation - just check if the key format looks correct
    let isValid = false;
    let message = '';

    switch (provider) {
      case 'claude':
        isValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20;
        message = isValid ? 'Claude API key format is valid' : 'Invalid Claude API key format';
        break;
      case 'openai':
        isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
        message = isValid ? 'OpenAI API key format is valid' : 'Invalid OpenAI API key format';
        break;
      default:
        message = 'Unsupported provider';
    }

    res.json({ isValid, message });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Get available AI models for a provider
router.post('/models/:provider', async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required to fetch models' });
    }

    // Check cache first
    const cachedResult = modelCache.get(provider, apiKey);
    if (cachedResult) {
      if (cachedResult.error) {
        return res.status(400).json({ error: cachedResult.error });
      }
      return res.json({ models: cachedResult.models });
    }

    let result: { models: { id: string; name: string; description?: string }[]; error?: string };

    switch (provider) {
      case 'claude':
        result = await ClaudeProvider.fetchAvailableModels(apiKey);
        break;
      case 'openai':
        result = await OpenAIProvider.fetchAvailableModels(apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    // Cache the result
    modelCache.set(provider, apiKey, result);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ models: result.models });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// Fallback route for models without API key (returns empty list)
router.get('/models/:provider', async (req, res, next) => {
  try {
    const { provider } = req.params;

    // Check if we have environment API keys as fallback
    let apiKey: string | undefined;
    switch (provider) {
      case 'claude':
        apiKey = process.env.CLAUDE_API_KEY;
        break;
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    if (!apiKey) {
      return res.json({
        models: [],
        message: 'API key required to fetch models. Please configure your API key first.',
      });
    }

    // Use environment API key
    let result: { models: { id: string; name: string; description?: string }[]; error?: string };
    switch (provider) {
      case 'claude':
        result = await ClaudeProvider.fetchAvailableModels(apiKey);
        break;
      case 'openai':
        result = await OpenAIProvider.fetchAvailableModels(apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    if (result.error) {
      return res.json({
        models: [],
        message: `Unable to fetch models: ${result.error}`,
      });
    }

    res.json({ models: result.models });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
