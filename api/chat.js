// api/chat.js - Universal Gateway with Auto-Healing & Fallback

export default async function handler(req, res) {
  // CORS Headers for frontend access
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
    const { message, businessType, businessDesc, shieldEnabled } = req.body;

    // API Key from Vercel Environment Variables (Production)
    // Fallback to body if testing locally without .env
    const apiKey = process.env.AI_API_KEY || req.body.apiKey;

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key missing. Add AI_API_KEY in Vercel Environment Variables.' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 1. Auto-Detect Provider & Base URL
    let provider = 'openai';
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (apiKey.startsWith('gsk_')) {
      provider = 'groq';
      baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (apiKey.startsWith('sk-or-')) {
      provider = 'openrouter';
      baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['HTTP-Referer'] = 'https://shield-by-vouch.vercel.app';
      headers['X-Title'] = 'Shield by Vouch';
    } else if (apiKey.startsWith('sk-ant-')) {
      provider = 'anthropic';
      baseUrl = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];
    }

    // 2. Auto-Healing Fallback Models
    const MODEL_FALLBACKS = {
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      openai: ['gpt-4o-mini', 'gpt-3.5-turbo'],
      openrouter: ['meta-llama/llama-3.1-8b-instruct', 'mistralai/mistral-7b-instruct'],
      anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
      default: ['gpt-3.5-turbo']
    };

    const targetModels = MODEL_FALLBACKS[provider] || MODEL_FALLBACKS.default;

    // 3. Dynamic System Prompt
    const systemPrompt = `You are a helpful AI assistant for a ${businessType || 'business'}. 
    Business Description: ${businessDesc || 'A standard business'}. 
    ONLY answer questions related to this business. If the user asks about your identity, coding, jokes, or anything unrelated, politely refuse and say you can only help with ${businessType || 'business'} related queries.`;

    let lastError = null;

    // 4. Try Models with Auto-Fallback
    for (const model of targetModels) {
      try {
        console.log(`Trying model: ${model} for provider: ${provider}`);
        
        let requestBody = {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        };

        // Anthropic uses a slightly different format
        if (provider === 'anthropic') {
          requestBody.model = model;
          requestBody.max_tokens = 1024;
        } else {
          requestBody.model = model;
        }

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Model ${model} failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract response based on provider format
        let aiReply = '';
        if (provider === 'anthropic') {
          aiReply = data.content?.[0]?.text || 'No response';
        } else {
          aiReply = data.choices?.[0]?.message?.content || 'No response';
        }

        // Success! Return response
        return res.status(200).json({ 
          success: true, 
          response: aiReply,
          model_used: model,
          provider: provider
        });

      } catch (error) {
        console.warn(`Model ${model} failed: ${error.message}`);
        lastError = error;
        // Continue to next fallback model automatically
      }
    }

    // All models failed
    return res.status(500).json({ 
      success: false, 
      error: 'All AI models failed. Please check your API key or try again later.',
      details: lastError?.message 
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
