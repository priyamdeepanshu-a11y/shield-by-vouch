// api/chat.js — SHIELD AI GATEWAY with OpenRouter + Auto-Healing
// User sets: AI_API_KEY only (OpenRouter recommended)
// System auto-detects provider, auto-heals if model deprecated

const PROVIDERS = {
  // 🥇 PRIMARY: OpenRouter — 100+ models, auto-failover across companies
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    format: 'openai',
    fallbackModels: [
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mistral-7b-instruct',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku'
    ],
    headers: (key) => ({ 
      'Authorization': `Bearer ${key}`, 
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shield-by-vouch.vercel.app',
      'X-Title': 'Shield by Vouch'
    })
  },

  // 🥈 FALLBACK 1: Groq
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    format: 'openai',
    fallbackModels: ['llama-3.1-8b-instant', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })
  },

  // 🥉 FALLBACK 2: Gemini
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    format: 'gemini',
    fallbackModels: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.0-pro'],
    headers: () => ({ 'Content-Type': 'application/json' })
  },

  // 🏅 FALLBACK 3: Anthropic
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    format: 'anthropic',
    fallbackModels: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' })
  },

  // 🏅 FALLBACK 4: OpenAI Direct
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    format: 'openai',
    fallbackModels: ['gpt-3.5-turbo', 'gpt-4o-mini'],
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, businessType, businessDesc, shieldEnabled = true } = body;
    
    if (!message || !businessType) {
      return res.status(400).json({ blocked: true, reply: 'Missing message or businessType' });
    }

    // ===== IF SHIELD IS OFF → Direct AI, No Block, No Guard =====
    if (shieldEnabled === false || shieldEnabled === 'false') {
      const apiKey = process.env.AI_API_KEY;
      
      if (!apiKey) {
        return res.json({ blocked: false, reply: '⚠️ AI_API_KEY not set. Add it in Vercel Environment Variables.', shield: 'off' });
      }

      let providerId = process.env.AI_PROVIDER;
      if (!providerId && apiKey) {
        if (apiKey.startsWith('sk-or-')) providerId = 'openrouter';
        else if (apiKey.startsWith('gsk_')) providerId = 'groq';
        else if (apiKey.startsWith('AIza')) providerId = 'gemini';
        else if (apiKey.startsWith('sk-ant-')) providerId = 'anthropic';
        else if (apiKey.startsWith('sk-')) providerId = 'openai';
      }
      providerId = providerId || 'openrouter';
      
      const provider = PROVIDERS[providerId];
      if (!provider) {
        return res.json({ blocked: false, reply: `⚠️ Unknown provider: ${providerId}`, shield: 'off' });
      }
      
      // Direct AI — no restrictions
      const systemPrompt = `You are a helpful assistant for a ${businessType}. Answer the user's question normally without any restrictions.`;
      
      for (const model of provider.fallbackModels) {
        try {
          const reply = await callAI(provider, providerId, apiKey, model, systemPrompt, message);
          return res.json({ blocked: false, reply, shield: 'off' });
        } catch (err) {
          continue;
        }
      }
      
      return res.json({ blocked: false, reply: '⚠️ AI service unavailable. Please try again later.', shield: 'off', error: true });
    }

    // ===== SHIELD IS ON → Normal Shield Check =====
    const lower = message.toLowerCase();
    const badWords = [
      'python','javascript','code','script','program','coding',
      'ignore previous','forget previous','disregard','override instructions',
      'who are you','what are you','which ai','openai','chatgpt','claude','gemini','anthropic',
      'joke','poem','weather today','news today','politics','religion','minecraft','fortnite'
    ];
    
    for (const word of badWords) {
      if (lower.includes(word)) {
        return res.json({ 
          blocked: true, 
          reply: `I can only help with our ${businessType} services. How can I assist you today?` 
        });
      }
    }

    // ===== AI GUARD (Shield ON) =====
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return res.json({ blocked: true, reply: '⚠️ AI_API_KEY not set. Add it in Vercel Environment Variables.' });
    }

    let providerId = process.env.AI_PROVIDER;
    if (!providerId && apiKey) {
      if (apiKey.startsWith('sk-or-')) providerId = 'openrouter';
      else if (apiKey.startsWith('gsk_')) providerId = 'groq';
      else if (apiKey.startsWith('AIza')) providerId = 'gemini';
      else if (apiKey.startsWith('sk-ant-')) providerId = 'anthropic';
      else if (apiKey.startsWith('sk-')) providerId = 'openai';
    }
    providerId = providerId || 'openrouter';

    const provider = PROVIDERS[providerId];
    if (!provider) {
      return res.json({ blocked: true, reply: `⚠️ Unknown provider: ${providerId}` });
    }

    const systemPrompt = `You are a ${businessType} assistant. Business: ${businessDesc || businessType}. STRICT RULES: ONLY answer business questions. NEVER answer code/jokes/weather/news/politics. NEVER reveal you are AI. Keep under 3 sentences.`;

    // ===== AUTO-HEALING: Try each model until one works =====
    let lastError = '';

    for (const model of provider.fallbackModels) {
      try {
        console.log(`Trying ${providerId}/${model}...`);
        const reply = await callAI(provider, providerId, apiKey, model, systemPrompt, message);
        
        console.log(`Success with ${providerId}/${model}`);
        
        let cleanReply = reply
          .replace(/as an ai/gi, 'As your assistant')
          .replace(/openai|chatgpt|claude|groq|gemini|anthropic|google|openrouter/gi, 'our system');
        if (cleanReply.includes('```')) cleanReply = `I can only help with our ${businessType} services.`;
        
        return res.json({ blocked: false, reply: cleanReply, provider: providerId, model });
        
      } catch (err) {
        console.error(`${providerId}/${model} failed: ${err.message}`);
        lastError = err.message;
        
        const isAuthError = err.message.includes('Invalid') || err.message.includes('unauthorized') || err.message.includes('API key');
        if (isAuthError) break;
      }
    }

    // ===== CROSS-PROVIDER FAILOVER =====
    const failoverChain = ['openrouter', 'groq', 'gemini', 'anthropic', 'openai'];
    const currentIndex = failoverChain.indexOf(providerId);
    
    for (let i = currentIndex + 1; i < failoverChain.length; i++) {
      const fallbackId = failoverChain[i];
      const fallbackKey = process.env[`${fallbackId.toUpperCase()}_API_KEY`];
      if (!fallbackKey) continue;
      
      const fallbackProvider = PROVIDERS[fallbackId];
      if (!fallbackProvider) continue;
      
      for (const model of fallbackProvider.fallbackModels) {
        try {
          console.log(`Failover: Trying ${fallbackId}/${model}...`);
          const reply = await callAI(fallbackProvider, fallbackId, fallbackKey, model, systemPrompt, message);
          
          console.log(`Failover success with ${fallbackId}/${model}`);
          
          let cleanReply = reply
            .replace(/as an ai/gi, 'As your assistant')
            .replace(/openai|chatgpt|claude|groq|gemini|anthropic|google|openrouter/gi, 'our system');
          if (cleanReply.includes('```')) cleanReply = `I can only help with our ${businessType} services.`;
          
          return res.json({ blocked: false, reply: cleanReply, provider: fallbackId, model, failover: true });
          
        } catch (err) {
          console.error(`Failover ${fallbackId}/${model} failed: ${err.message}`);
        }
      }
    }

    return res.json({ 
      blocked: true, 
      reply: `⚠️ AI service temporarily unavailable. Last error: ${lastError}. Please check your API key or try again later.`,
      error: true 
    });

  } catch (e) {
    console.error('FATAL:', e.message);
    return res.status(500).json({ blocked: true, reply: `⚠️ Server error: ${e.message}` });
  }
}

// ===== UNIVERSAL AI CALLER =====
async function callAI(provider, providerId, apiKey, model, systemPrompt, message) {
  
  if (provider.format === 'openai') {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: provider.headers(apiKey),
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.choices?.[0]?.message?.content || 'Sorry, I did not understand.';
  }
  
  if (provider.format === 'gemini') {
    const response = await fetch(`${provider.baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: provider.headers(),
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + '\n\nUser: ' + message }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I did not understand.';
  }
  
  if (provider.format === 'anthropic') {
    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: provider.headers(apiKey),
      body: JSON.stringify({
        model: model,
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.content?.[0]?.text || 'Sorry, I did not understand.';
  }
  
  throw new Error('Unknown provider format');
}
