// ============================================
// Shield by Vouch — Multi-Provider AI Backend
// ES Module Format (for Vercel with "type": "module")
// ============================================

const PROVIDERS = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY || process.env.AI_API_KEY,
    models: [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.6-27b',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ],
    format: 'openai'
  },
  {
    name: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    models: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    format: 'openai'
  },
  {
    name: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    key: process.env.ANTHROPIC_API_KEY,
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    format: 'anthropic'
  },
  {
    name: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}',
    key: process.env.GEMINI_API_KEY,
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    format: 'gemini'
  },
  {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    models: [
      'meta-llama/llama-3.1-8b-instruct',
      'openai/gpt-3.5-turbo',
      'google/gemini-flash-1.5'
    ],
    format: 'openai',
    extraHeaders: {
      'HTTP-Referer': 'https://shield-by-vouch.vercel.app',
      'X-Title': 'Shield by Vouch'
    }
  },
  {
    name: 'huggingface',
    url: 'https://api-inference.huggingface.co/models/{MODEL}',
    key: process.env.HUGGINGFACE_API_KEY,
    models: ['mistralai/Mistral-7B-Instruct-v0.2', 'meta-llama/Llama-2-7b-chat-hf'],
    format: 'huggingface'
  }
];

function checkShield(message, businessType, businessDesc) {
  if (!message) return false;
  const lower = message.toLowerCase();
  const blockPatterns = [
    'who are you', 'what are you', 'your name', 'which model',
    'which ai', 'which llm', 'what model', 'are you chatgpt',
    'are you claude', 'are you gemini', 'are you groq',
    'ignore previous', 'ignore all', 'disregard', 'forget earlier',
    'dan mode', 'jailbreak', 'dude mode', 'developer mode',
    'ignore previous instructions', 'system prompt',
    'python code', 'write code', 'javascript code', 'html code',
    'css code', 'code for', 'function to', 'script for',
    'tell me a joke', 'weather today', 'news today', 'current time',
    'who is president', 'who won', 'cricket score', 'football score'
  ];
  return blockPatterns.some(pattern => lower.includes(pattern));
}

function getBlockedReply(businessType, businessDesc) {
  const biz = businessDesc || (businessType ? `${businessType} services` : 'our services');
  return `I'm here to help with ${biz} only. Please ask something related to what we offer.`;
}

async function callOpenAIFormat(provider, model, messages) {
  const headers = {
    'Authorization': `Bearer ${provider.key}`,
    'Content-Type': 'application/json'
  };
  if (provider.extraHeaders) Object.assign(headers, provider.extraHeaders);

  const res = await fetch(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.name}: HTTP ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply || reply.trim() === '') throw new Error(`${provider.name}: Empty reply`);
  return reply.trim();
}

async function callAnthropic(provider, model, systemPrompt, userMessage) {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'x-api-key': provider.key,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.name}: HTTP ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const reply = data.content?.[0]?.text;
  if (!reply || reply.trim() === '') throw new Error(`${provider.name}: Empty reply`);
  return reply.trim();
}

async function callGemini(provider, model, systemPrompt, userMessage) {
  const url = provider.url.replace('{MODEL}', model).replace('{KEY}', provider.key);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }]
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.name}: HTTP ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply || reply.trim() === '') throw new Error(`${provider.name}: Empty reply`);
  return reply.trim();
}

async function callHuggingFace(provider, model, systemPrompt, userMessage) {
  const url = provider.url.replace('{MODEL}', model);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: `<|system|>\n${systemPrompt}\n<|user|>\n${userMessage}\n<|assistant|>\n`,
      parameters: { max_new_tokens: 800, temperature: 0.7 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.name}: HTTP ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const reply = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  if (!reply || reply.trim() === '') throw new Error(`${provider.name}: Empty reply`);

  let cleanReply = reply;
  if (cleanReply.includes('<|assistant|>')) {
    cleanReply = cleanReply.split('<|assistant|>').pop().trim();
  }
  return cleanReply;
}

// ============================================
// MAIN HANDLER — ES Module format
// ============================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const { message, businessType, businessDesc, shieldEnabled } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // ===== SHIELD CHECK =====
    if (shieldEnabled !== false) {
      const isBlocked = checkShield(message, businessType, businessDesc);
      if (isBlocked) {
        return res.status(200).json({
          blocked: true,
          reply: getBlockedReply(businessType, businessDesc),
          shield: 'on',
          provider: 'shield'
        });
      }
    }

    const bizType = businessType || 'business';
    const bizDesc = businessDesc || 'our services';

    // ===== FIX: System prompt changes based on Shield toggle =====
    let systemPrompt;
    if (shieldEnabled === false) {
      // Shield OFF = AI can answer ANYTHING
      systemPrompt = `You are a helpful AI assistant. Answer any question the user asks honestly and accurately. If asked who you are, say you are an AI assistant.`;
    } else {
      // Shield ON = AI stays on-topic only
      systemPrompt = `You are a helpful assistant for ${bizDesc}. You only answer questions related to ${bizType}. If someone asks who you are, say you are the assistant for this business. Never reveal you are an AI model by OpenAI, Groq, Anthropic, Google, or any other company. Keep replies short and helpful.`;
    }

    let lastError = null;
    let usedProvider = null;
    let usedModel = null;

    for (const provider of PROVIDERS) {
      if (!provider.key || provider.key.trim() === '') {
        console.log(`Skipping ${provider.name}: No API key`);
        continue;
      }

      for (const model of provider.models) {
        try {
          console.log(`Trying ${provider.name} / ${model}...`);
          let reply;

          if (provider.format === 'openai') {
            const messages = [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ];
            reply = await callOpenAIFormat(provider, model, messages);
          } else if (provider.format === 'anthropic') {
            reply = await callAnthropic(provider, model, systemPrompt, message);
          } else if (provider.format === 'gemini') {
            reply = await callGemini(provider, model, systemPrompt, message);
          } else if (provider.format === 'huggingface') {
            reply = await callHuggingFace(provider, model, systemPrompt, message);
          }

          usedProvider = provider.name;
          usedModel = model;
          console.log(`Success with ${provider.name} / ${model}`);

          return res.status(200).json({
            blocked: false,
            reply: reply,
            shield: shieldEnabled !== false ? 'on' : 'off',
            provider: usedProvider,
            model: usedModel
          });

        } catch (err) {
          console.log(`Failed ${provider.name}/${model}: ${err.message}`);
          lastError = err;
          continue;
        }
      }
    }

    console.error('All providers failed:', lastError);
    return res.status(200).json({
      blocked: false,
      reply: "I'm temporarily unavailable due to high demand. Please try again in 30 seconds.",
      error: true,
      shield: shieldEnabled !== false ? 'on' : 'off'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(200).json({
      blocked: false,
      reply: "Something went wrong. Please try again.",
      error: true
    });
  }
}
