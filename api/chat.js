export default async function handler(req, res) {
  const { message, apiKey, businessType, businessDesc, shieldEnabled } = req.body;
  
  // 1. Auto-detect provider
  const provider = detectProvider(apiKey);
  if (provider === 'unknown') {
    return res.status(400).json({ error: 'Invalid API key format' });
  }
  
  // 2. Check Shield first
  if (shieldEnabled !== false) {
    const isBlocked = await checkShield(message, businessType, businessDesc);
    if (isBlocked) {
      return res.json({ 
        blocked: true, 
        response: "I can only help with our business services." 
      });
    }
  }
  
  // 3. Call AI with auto-fallback
  try {
    const response = await callAIWithFallback(message, provider, apiKey);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ 
      error: 'All AI models failed',
      message: error.message 
    });
  }
}
