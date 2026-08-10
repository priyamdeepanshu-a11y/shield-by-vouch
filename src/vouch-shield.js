/**
 * Shield by Vouch — Client-side protection
 * Blocks off-topic questions before they hit your LLM
 * GitHub: https://github.com/priyamdeepanshu-a11y/shield-by-vouch
 */

class VouchShield {
  constructor(options = {}) {
    this.businessType = options.businessType || 'business';
    this.businessDesc = options.businessDesc || this.businessType;
    this.strictMode = options.strictMode || false;
    this.customBlockList = options.customBlockList || [];
    
    this.blockedKeywords = [
      'python', 'javascript', 'code', 'script', 'program', 'coding',
      'ignore previous', 'forget previous', 'disregard', 'override instructions',
      'who are you', 'what are you', 'which ai', 'openai', 'chatgpt', 'claude', 'gemini', 'anthropic',
      'sky blue', 'physics', 'chemistry', 'joke', 'poem', 'weather today',
      'news today', 'politics', 'religion', 'minecraft', 'fortnite',
      ...this.customBlockList
    ];
    
    this.injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|commands)/i,
      /you\s+are\s+now\s+(DAN|dan)/i,
      /do\s+anything\s+now/i,
      /jailbreak/i,
      /developer\s+mode/i
    ];
  }

  check(message) {
    if (!message || typeof message !== 'string') {
      return { blocked: true, response: 'Invalid message', reason: 'invalid_input' };
    }

    const lower = message.toLowerCase();

    // Layer 1: Keyword filter
    for (const word of this.blockedKeywords) {
      if (lower.includes(word.toLowerCase())) {
        return {
          blocked: true,
          response: `I can only help with our ${this.businessType} services. How can I assist you today?`,
          reason: 'keyword_blocked',
          matched: word
        };
      }
    }

    // Layer 2: Pattern injection
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(message)) {
        return {
          blocked: true,
          response: `I can only help with our ${this.businessType} services. How can I assist you today?`,
          reason: 'injection_detected'
        };
      }
    }

    // Layer 3: Strict mode
    if (this.strictMode) {
      const businessWords = this.businessDesc.toLowerCase().split(' ');
      const hasBusinessContext = businessWords.some(w => lower.includes(w));
      if (!hasBusinessContext && message.length > 10) {
        return {
          blocked: true,
          response: `I can only help with our ${this.businessType} services. How can I assist you today?`,
          reason: 'strict_mode'
        };
      }
    }

    return { blocked: false, response: null, reason: 'safe' };
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VouchShield };
} else if (typeof window !== 'undefined') {
  window.VouchShield = VouchShield;
}
