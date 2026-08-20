// api/chat.js - Final Production Ready Version

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, apiKey, businessType, businessDesc, shieldEnabled } = req.body;

    // API Key: Pehle body se lo (demo ke liye), nahi mila toh Vercel .env se lo
    const userApiKey = apiKey || process.env.AI_API_KEY;

    if (!userApiKey) {
      return res.status(400).json({ error: 'API Key missing. Add AI_API_KEY in Vercel Environment Variables OR send in request body.' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 1. Auto-Detect Provider & Base URL
    let provider = 'openai';
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userApiKey}`
    };

    if (userApiKey.startsWith('gsk_')) {
      provider = 'groq';
      baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (userApiKey.startsWith('sk-or-')) {
      provider = 'openrouter';
      baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['HTTP-Referer'] = 'https://shield-by-vouch.vercel.app';
      headers['X-Title'] = 'Shield by Vouch';
    } else if (userApiKey.startsWith('sk-ant-')) {
      provider = 'anthropic';
      baseUrl = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = userApiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];
    } else if (userApiKey.startsWith('AIza')) {
      provider = 'gemini';
      baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${userApiKey}`;
      headers = { 'Content-Type': 'application/json' };
    }

    // 2. Auto-Healing Fallback Models
    const MODEL_FALLBACKS = {
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      openai: ['gpt-4o-mini', 'gpt-3.5-turbo'],
      openrouter: ['meta-llama/llama-3.1-8b-instruct', 'mistralai/mistral-7b-instruct'],
      anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
      gemini: ['gemini-1.5-flash-latest'],
      default: ['gpt-3.5-turbo']
    };

    const targetModels = MODEL_FALLBACKS[provider] || MODEL_FALLBACKS.default;

    // 3. Dynamic System Prompt
    const systemPrompt = `You are a helpful AI assistant for a ${businessType || 'business'}. 
    Business Description: ${businessDesc || 'A standard business'}. 
    ONLY answer questions related to this business. If the user asks about your identity, coding, jokes, or anything unrelated, politely refuse and say you can only help with ${businessType || 'business'} related queries.`;

    let lastError = null;

    // 4. Try Models with Auto-Fallback (The "Auto-Healing" Magic)
    for (const model of targetModels) {
      try {
        console.log(`Trying model: ${model} for provider: ${provider}`);
        
        let requestBody = {};

        // Provider-specific request formats
        if (provider === 'anthropic') {
          requestBody = {
            model: model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: `${systemPrompt}\n\nUser: ${message}` }]
          };
        } else if (provider === 'gemini') {
          requestBody = {
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
            generationConfig: { maxOutputTokens: 1024 }
          };
        } else {
          // OpenAI, Groq, OpenRouter format
          requestBody = {
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.7
          };
        }

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn(`Model ${model} failed: ${errData.error?.message || response.status}`);
          lastError = new Error(errData.error?.message || `Status ${response.status}`);
          continue; // CRITICAL: Don't break, try the next model!
        }

        const data = await response.json();
        
        // Provider-specific response parsing
        let aiReply = '';
        if (provider === 'anthropic') {
          aiReply = data.content?.[0]?.text || 'No response';
        } else if (provider === 'gemini') {
          aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        } else {
          aiReply = data.choices?.[0]?.message?.content || 'No response';
        }

        // SUCCESS! Return immediately.
        return res.status(200).json({ 
          success: true, 
          response: aiReply,
          model_used: model,
          provider: provider
        });

      } catch (error) {
        console.warn(`Model ${model} error: ${error.message}`);
        lastError = error;
        continue; // Try next model
      }
    }

    // All models failed
    return res.status(500).json({ 
      success: false, 
      error: 'All AI models failed. Please check your API key or try again later.',
      details: lastError?.message,
      tried_models: targetModels
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error.',
      message: error.message 
    });
  }
}
