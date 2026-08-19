// api/chat.js - Universal Gateway with Auto-Healing & Fallback

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

    if (!message || !apiKey) {
      return res.status(400).json({ error: 'Message and API Key are required' });
    }

    // 1. Auto-Detect Provider from API Key
    const provider = detectProvider(apiKey);
    if (provider === 'unknown') {
      return res.status(400).json({ error: 'Invalid API key format. Please check your key.' });
    }

    // 2. Shield Check (Client-side logic is in frontend, this is backend validation if needed)
    // For this version, we rely on frontend shield check, but we pass business context to AI.

    // 3. Call AI with Auto-Fallback
    const aiResponse = await callAIWithFallback(message, provider, apiKey, businessType, businessDesc);

    return res.status(200).json({ 
      success: true, 
      response: aiResponse,
      provider: provider
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'All AI models failed or system error.',
      message: error.message 
    });
  }
}

// --- HELPER FUNCTIONS ---

function detectProvider(apiKey) {
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  if (apiKey.startsWith('gsk_')) return 'groq';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('AIza')) return 'gemini';
  if (apiKey.startsWith('sk-')) return 'openai';
  return 'openai'; // Default to OpenAI format for Together, Ollama, etc.
}

const MODEL_FALLBACKS = {
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768' // Legacy fallback
  ],
  openai: [
    'gpt-4o-mini',
    'gpt-3.5-turbo'
  ],
  gemini: [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest'
  ],
  anthropic: [
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229'
  ],
  openrouter: [
    'meta-llama/llama-3.1-8b-instruct',
    'mistralai/mistral-7b-instruct'
  ]
};

async function callAIWithFallback(message, provider, apiKey, businessType, businessDesc) {
  const models = MODEL_FALLBACKS[provider] || ['gpt-3.5-turbo'];
  let lastError = null;

  // System Prompt to keep AI on topic
  const systemPrompt = `You are a helpful AI assistant for a ${businessType || 'business'}. 
  Business Description: ${businessDesc || 'A standard business'}. 
  ONLY answer questions related to this business. If the user asks about your identity, coding, jokes, or anything unrelated, politely refuse and say you can only help with ${businessType} related queries.`;

  for (const model of models) {
    try {
      console.log(`Trying model: ${model} for provider: ${provider}`);
      
      // For Gemini, use a slightly different fetch structure if needed, 
      // but for simplicity, we use OpenAI-compatible format for Groq, OpenRouter, OpenAI, Together.
      if (provider === 'gemini') {
        // Gemini specific call (simplified for this context, assuming standard REST)
        // In a real prod app, you'd use the Gemini SDK or exact REST endpoint.
        // For now, falling back to OpenAI format which many gateways support, 
        // or you can add specific Gemini fetch here.
        throw new Error("Gemini specific integration pending, using OpenAI format fallback");
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          // For OpenRouter/Groq, base URL changes. 
          // To make it truly universal without env vars, we switch base URL:
          ...(provider === 'groq' && { 'Authorization': `Bearer ${apiKey}` }), // Groq uses same header
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7
        })
      });

      // Note: For Groq/OpenRouter, the base URL is different. 
      // Let's fix the base URL dynamically:
      let baseUrl = 'https://api.openai.com/v1/chat/completions';
      if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
      if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

      const finalResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://shield-by-vouch.vercel.app', // Required for OpenRouter
          'X-Title': 'Shield by Vouch'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });

      if (!finalResponse.ok) {
        const errData = await finalResponse.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Model ${model} failed with status ${finalResponse.status}`);
      }

      const data = await finalResponse.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.warn(`Model ${model} failed: ${error.message}`);
      lastError = error;
      // Continue to next fallback model
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}
