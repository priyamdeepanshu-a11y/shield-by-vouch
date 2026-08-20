// api/chat.js - 100% FINAL PRODUCTION VERSION
// Auto-Healing, Multi-Provider, Secure

export default async function handler(req, res) {
  // 1. CORS Headers
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
    const { message, businessType, businessDesc, apiKey: bodyApiKey } = req.body;

    // 2. SECURE API KEY HANDLING
    // Priority: Vercel Environment Variable (Production) > Request Body (Testing)
    const apiKey = process.env.AI_API_KEY || bodyApiKey;

    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ 
        error: 'API Key missing. Add AI_API_KEY in Vercel Environment Variables.' 
      });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 3. AUTO-DETECT PROVIDER & BASE URL
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
    } else if (apiKey.startsWith('AIza')) {
      provider = 'gemini';
      baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
    }

    // 4. AUTO-HEALING FALLBACK MODELS
    const MODEL_FALLBACKS = {
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      openai: ['gpt-4o-mini', 'gpt-3.5-turbo'],
      openrouter: ['meta-llama/llama-3.1-8b-instruct', 'mistralai/mistral-7b-instruct'],
      anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
      gemini: ['gemini-1.5-flash-latest'],
      default: ['gpt-3.5-turbo']
    };

    const targetModels = MODEL_FALLBACKS[provider] || MODEL_FALLBACKS.default;

    // 5. DYNAMIC SYSTEM PROMPT
    const systemPrompt = `You are a helpful AI assistant for a ${businessType || 'business'}. 
    Business Description: ${businessDesc || 'A standard business'}. 
    ONLY answer questions related to this business. If the user asks about your identity, coding, jokes, or anything unrelated, politely refuse and say you can only help with ${businessType || 'business'} related queries.`;

    let lastError = null;

    // 6. TRY MODELS WITH AUTO-FALLBACK (The Magic)
    for (const model of targetModels) {
      try {
        console.log(`[Shield Backend] Trying model: ${model} for provider: ${provider}`);
        
        let requestBody = {};

        // Provider-specific formats
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
          // OpenAI, Groq, OpenRouter
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
          console.warn(`[Shield Backend] Model ${model} failed: ${errData.error?.message || response.status}`);
          lastError = new Error(errData.error?.message || `Status ${response.status}`);
          continue; // CRITICAL: Don't break! Try next model.
        }

        const data = await response.json();
        
        // Parse response based on provider
        let aiReply = '';
        if (provider === 'anthropic') {
          aiReply = data.content?.[0]?.text || 'No response';
        } else if (provider === 'gemini') {
          aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        } else {
          aiReply = data.choices?.[0]?.message?.content || 'No response';
        }

        // SUCCESS!
        return res.status(200).json({ 
          success: true, 
          response: aiReply,
          model_used: model,
          provider: provider
        });

      } catch (error) {
        console.warn(`[Shield Backend] Model ${model} error: ${error.message}`);
        lastError = error;
        continue; 
      }
    }

    // ALL MODELS FAILED
    return res.status(500).json({ 
      success: false, 
      error: 'All AI models failed. Please check your API key.',
      details: lastError?.message
    });

  } catch (error) {
    console.error('[Shield Backend] Fatal Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error.',
      message: error.message 
    });
  }
}
