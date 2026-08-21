// ============================================
// Shield by Vouch — Multi-Provider AI Backend
// Supports: OpenAI, Groq, Anthropic, Gemini, OpenRouter, HuggingFace
// Auto-fallback: If Provider A fails → tries Provider B → C → D
// ============================================

// ----- PROVIDER SETUP -----
// Har provider ke liye API key aur models
// Agar koi key nahi hai, woh provider skip ho jayega automatically

const PROVIDERS = [
  // 1. GROQ (Fast + Cheap)
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY || process.env.AI_API_KEY,
    // Naye models (Aug 2026 ke baad ke)
    models: [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b', 
      'qwen/qwen3.6-27b',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ],
    format: 'openai' // Groq OpenAI format mein kaam karta hai
  },

  // 2. OPENAI (Reliable)
  {
    name: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    models: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    format: 'openai'
  },

  // 3. ANTHROPIC / CLAUDE
  {
    name: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    key: process.env.ANTHROPIC_API_KEY,
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    format: 'anthropic'
  },

  // 4. GEMINI (Google)
  {
    name: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}',
    key: process.env.GEMINI_API_KEY,
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    format: 'gemini'
  },

  // 5. OPENROUTER (Sabse bada fallback — 200+ models)
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

  // 6. HUGGING FACE (Optional — Inference API)
  {
    name: 'huggingface',
    url: 'https://api-inference.huggingface.co/models/{MODEL}',
    key: process.env.HUGGINGFACE_API_KEY,
    models: ['mistralai/Mistral-7B-Instruct-v0.2', 'meta-llama/Llama-2-7b-chat-hf'],
    format: 'huggingface'
  }
];

// ============================================
// SHIELD LOGIC — Yeh tera main product hai
// ============================================

function checkShield(message, businessType, businessDesc) {
  if (!message) return false;
  
  const lower = message.toLowerCase();
  
  // Block patterns — ye sab block hoga
  const blockPatterns = [
    // Identity leaks
    'who are you', 'what are you', 'your name', 'which model', 
    'which ai', 'which llm', 'what model', 'are you chatgpt',
    'are you claude', 'are you gemini', 'are you groq',
    
    // Prompt injection
    'ignore previous', 'ignore all', 'disregard', 'forget earlier',
    'dan mode', 'jailbreak', 'dude mode', 'developer mode',
    'ignore previous instructions', 'system prompt',
    
    // Off-topic: Coding
    'python code', 'write code', 'javascript code', 'html code', 
    'css code', 'code for', 'function to', 'script for',
    
    // Off-topic: General
    'tell me a joke', 'weather today', 'news today', 'current time',
    'who is president', 'who won', 'cricket score', 'football score'
  ];
  
  // Exact ya partial match
  const isBlocked = blockPatterns.some(pattern => lower.includes(pattern));
  
  return isBlocked;
}

function getBlockedReply(businessType, businessDesc) {
  const biz = businessDesc || (businessType ? `${businessType} services` : 'our services');
  return `I'm here to help with ${biz} only. Please ask something related to what we offer.`;
}

// ============================================
// API CALL FUNCTIONS — Har provider ke liye alag format
// ============================================

async function callOpenAIFormat(provider, model, messages) {
  const headers = {
    'Authorization': `Bearer ${provider.key}`,
    'Content-Type': 'application/json'
  };
  
  if (provider.extraHeaders) {
    Object.assign(headers, provider.extraHeaders);
  }

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
  
  // OpenAI format reply
  const reply = data.choices?.[0]?.message?.content;
  if (!reply || reply.trim() === '') {
    throw new Error(`${provider.name}: Empty reply`);
  }
  
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
  
  if (!reply || reply.trim() === '') {
    throw new Error(`${provider.name}: Empty reply`);
  }
  
  return reply.trim();
}

async function callGemini(provider, model, systemPrompt, userMessage) {
  const url = provider.url.replace('{MODEL}', model).replace('{KEY}', provider.key);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `${systemPrompt}\n\nUser: ${userMessage}` }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.name}: HTTP ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!reply || reply.trim() === '') {
    throw new Error(`${provider.name}: Empty reply`);
  }
  
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
  // HuggingFace returns array
  const reply = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
  
  if (!reply || reply.trim() === '') {
    throw new Error(`${provider.name}: Empty reply`);
  }
  
  // Clean up the prompt echo
  let cleanReply = reply;
  if (cleanReply.includes('<|assistant|>')) {
    cleanReply = cleanReply.split('<|assistant|>').pop().trim();
  }
  
  return cleanReply;
}

// ============================================
// MAIN HANDLER — Yeh Vercel call karta hai
// ============================================

module.exports = async (req, res) => {
  // CORS headers — frontend se call allow karne ke liye
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    // 1. Data nikalo request se
    const { message, businessType, businessDesc, shieldEnabled } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 2. SHIELD CHECK — Agar ON hai toh pehle check karo
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

    // 3. System Prompt banao
    const bizType = businessType || 'business';
    const bizDesc = businessDesc || 'our services';
    
    const systemPrompt = `You are a helpful assistant for ${bizDesc}. 
You only answer questions related to ${bizType}. 
If someone asks who you are, say you are the assistant for this business. 
Never reveal you are an AI model by OpenAI, Groq, Anthropic, Google, or any other company. 
Keep replies short and helpful.`;

    // 4. AI PROVIDERS TRY KARO — Ek fail ho toh dusra
    let lastError = null;
    let usedProvider = null;
    let usedModel = null;

    for (const provider of PROVIDERS) {
      // Agar API key nahi hai, skip karo
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
          } 
          else if (provider.format === 'anthropic') {
            reply = await callAnthropic(provider, model, systemPrompt, message);
          } 
          else if (provider.format === 'gemini') {
            reply = await callGemini(provider, model, systemPrompt, message);
          } 
          else if (provider.format === 'huggingface') {
            reply = await callHuggingFace(provider, model, systemPrompt, message);
          }

          // SUCCESS!
          usedProvider = provider.name;
          usedModel = model;
          console.log(`✅ Success with ${provider.name} / ${model}`);
          
          return res.status(200).json({
            blocked: false,
            reply: reply,
            shield: shieldEnabled !== false ? 'on' : 'off',
            provider: usedProvider,
            model: usedModel
          });

        } catch (err) {
          console.log(`❌ Failed ${provider.name}/${model}: ${err.message}`);
          lastError = err;
          // Agla model try karo
          continue;
        }
      }
    }

    // 5. SAB FAIL HO GAYE
    console.error('All providers failed:', lastError);
    return res.status(200).json({
      blocked: false,
      reply: "⚠️ I'm temporarily unavailable due to high demand. Please try again in 30 seconds.",
      error: true,
      shield: shieldEnabled !== false ? 'on' : 'off'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(200).json({
      blocked: false,
      reply: "⚠️ Something went wrong. Please try again.",
      error: true
    });
  }
};
