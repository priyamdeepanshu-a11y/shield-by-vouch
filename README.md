# 🛡️ Shield by Vouch

**Lock Your AI Chatbot to Its Business. Nothing Else.**

[![Live Demo](https://img.shields.io/badge/🔥%20Try%20Live%20Demo-00ff41?style=for-the-badge)](https://shield-by-vouch.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/priyamdeepanshu-a11y/shield-by-vouch?color=00ff41&style=for-the-badge)](https://github.com/priyamdeepanshu-a11y/shield-by-vouch/stargazers)
[![License](https://img.shields.io/badge/License-MIT-00ff41?style=for-the-badge)](https://github.com/priyamdeepanshu-a11y/shield-by-vouch/blob/main/LICENSE)

**Zero Cost · Open Source · 3-Layer AI Protection**

---

## 🎬 What It Does

Stop wasting API tokens on off-topic questions. **Shield** blocks prompt injection, identity leaks, and irrelevant queries **before** they reach your LLM.

| Attack | Result |
|--------|--------|
| `"Python code batao"` | 🔴 **BLOCKED** — API call saved |
| `"Ignore previous instructions"` | 🔴 **BLOCKED** — Injection caught |
| `"Who are you? Which AI?"` | 🔴 **BLOCKED** — Identity protected |
| `"Pizza order karna hai"` | 🟢 **ALLOWED** — Normal AI reply |

---

## 🚀 Quick Start

👉 **[shield-by-vouch.vercel.app](https://shield-by-vouch.vercel.app)** — Live Demo

---

## 📦 Use In Your Project

### 🔵 Option A: HTML Website (Simplest — No Install)

**Step 1:** Copy this code and paste it in your HTML file (inside `<body>` tag):

```html
<script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch@main/src/vouch-shield.js"></script>
<script>
  const shield = new VouchShield({
    businessType: 'restaurant',
    businessDesc: 'We serve Italian food in Mumbai'
  });

  const result = shield.check("Who are you?");

  if (result.blocked) {
    console.log("🛡️ Blocked:", result.response);
  } else {
    console.log("✅ Safe — send to LLM");
  }
</script>
```

**Done!** No download, no install. Just paste and use.

---

### 🟡 Option B: Python

**Step 1:** Download the file. Open your terminal and type:
```bash
curl -O https://raw.githubusercontent.com/priyamdeepanshu-a11y/shield-by-vouch/main/src/vouch-shield.py
```

**Step 2:** In your Python file, paste this:
```python
from vouch_shield import VouchShield

shield = VouchShield(
    business_type="restaurant",
    business_desc="We serve Italian food in Mumbai"
)

result = shield.check("Who are you?")

if result["blocked"]:
    print("🛡️ Blocked:", result["response"])
else:
    print("✅ Safe — send to LLM")
```

**Done!**

---

### 🟢 Option C: Node.js

**Step 1:** Install using npm. Open terminal and type:
```bash
npm install shield-by-vouch
```

**Step 2:** In your JavaScript file, paste this:
```javascript
const { VouchShield } = require('shield-by-vouch');

const shield = new VouchShield({
  businessType: 'restaurant',
  businessDesc: 'We serve Italian food in Mumbai'
});

const result = shield.check("Who are you?");
if (result.blocked) {
  console.log("🛡️ Blocked:", result.response);
}
```

**Done!**

---

### 🟣 Option D: React

**Step 1:** Install using npm. Open terminal and type:
```bash
npm install shield-by-vouch
```

**Step 2:** In your React file, paste this:
```jsx
import { VouchShield } from 'shield-by-vouch';

const shield = new VouchShield({ businessType: 'restaurant' });

function ChatInput() {
  const handleSend = (message) => {
    const result = shield.check(message);
    if (result.blocked) {
      alert(result.response);
      return;
    }
    // Call your LLM API here
  };
}
```

**Done!**

---

### ⚫ Option E: Terminal / CLI (Command Line)

**Step 1:** Copy this and paste in terminal:
```bash
git clone https://github.com/priyamdeepanshu-a11y/shield-by-vouch.git
cd shield-by-vouch
python src/vouch-shield.py
```

**Done!**

---

## ⚙️ How to Change Settings

```javascript
const shield = new VouchShield({
  businessType: 'restaurant',              // Your business name
  businessDesc: 'Italian food in Mumbai',   // What you do
  strictMode: true,                        // Block more strictly
  customBlockList: ['bitcoin', 'crypto']   // Extra words to block
});
```

---

## 🛡️ How It Works

```
User Message ──▶ 🛡️ Shield Check ──▶ Blocked? ──▶ 🔴 No API Call ($0 saved)
                                    └── No? ───▶ 🟢 Send to LLM
```

| Layer | What It Blocks |
|-------|---------------|
| **1. Keyword Filter** | Code requests, identity questions, off-topic |
| **2. Pattern Match** | "Ignore previous", "DAN", injection attempts |
| **3. AI Guard** | Groq API fallback with strict system prompt |

---

## 🌐 Self-Host API (Vercel)

Want your own backend?

1. Fork this repo
2. Add `GROQ_API_KEY` in Vercel Environment Variables
3. Deploy — API live at `your-domain.com/api/chat`

```javascript
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: userInput,
    businessType: 'restaurant'
  })
});
```

---

## 🏗️ Project Structure

```
shield-by-vouch/
├── demo/
│   └── index.html          # 🌐 Live demo website
├── src/
│   ├── vouch-shield.js     # 📦 JavaScript library
│   └── vouch-shield.py     # 🐍 Python library
├── api/
│   └── chat.js             # ⚡ Vercel API
├── package.json
├── vercel.json
└── README.md
```

---

## 📄 Library Source Code

Save this code as `src/vouch-shield.js` in your project:

```javascript
/**
 * Shield by Vouch — Client-side protection
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

    for (const pattern of this.injectionPatterns) {
      if (pattern.test(message)) {
        return {
          blocked: true,
          response: `I can only help with our ${this.businessType} services. How can I assist you today?`,
          reason: 'injection_detected'
        };
      }
    }

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VouchShield };
} else if (typeof window !== 'undefined') {
  window.VouchShield = VouchShield;
}
```

---

## 🤝 Contributing

1. Fork → Branch → Commit → Push → Pull Request

## 📄 License

**MIT** — free for personal & commercial use.

**Made with 🛡️ by Vouch**
