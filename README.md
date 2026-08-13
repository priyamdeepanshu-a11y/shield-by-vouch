# 🛡️ Shield by Vouch

<p align="center">
  <b>Lock Your AI Chatbot to Its Business. Nothing Else.</b>
</p>

<p align="center">
  <a href="https://shield-by-vouch.vercel.app"><img src="https://img.shields.io/badge/🔥%20Live%20Demo-00ff41?style=for-the-badge"></a>
  <a href="https://github.com/priyamdeepanshu-a11y/shield-by-vouch/stargazers"><img src="https://img.shields.io/github/stars/priyamdeepanshu-a11y/shield-by-vouch?color=00ff41&style=for-the-badge"></a>
  <a href="https://github.com/priyamdeepanshu-a11y/shield-by-vouch/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-00ff41?style=for-the-badge"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Zero%20Cost-✓-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/Open%20Source-✓-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/Auto--Healing-✓-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/100%2B%20AI%20Models-✓-brightgreen?style=flat-square">
</p>

---

## Why Shield?

Every off-topic question to your AI chatbot costs money. Worse — it leaks your brand identity and opens security holes.

**Shield stops both.**

| Without Shield | With Shield |
|---|---|
| "Who are you?" → AI reveals it's ChatGPT/Gemini/Claude | 🔴 **Blocked instantly** — no API call |
| "Python code batao" → Wastes tokens + off-brand | 🔴 **Blocked instantly** — $0.00 spent |
| "Ignore previous instructions" → Jailbroken | 🔴 **Injection caught** — attack stopped |
| "I want to order" → Normal business reply | 🟢 **Allowed** — AI replies normally |

---

## Features

- **⚡ Zero-Latency Block** — Client-side filter stops bad messages before any API call
- **🛡️ 3-Layer Protection** — Keyword filter + injection pattern detection + AI guard
- **🔄 Auto-Healing Backend** — Model deprecated? System auto-tries the next one. Zero downtime.
- **🌐 Universal AI Support** — Works with OpenRouter, Groq, OpenAI, Anthropic, Gemini, Together, Ollama
- **🔑 Key Auto-Detect** — Paste any API key. System detects the provider automatically.
- **🔀 Cross-Provider Failover** — Primary down? Auto-switches to backup provider
- **🎚️ Live Toggle** — Turn Shield ON/OFF in real-time from your UI
- **📱 Mobile Ready** — Fully responsive demo and test pages
- **🐍 Multi-Language** — JavaScript, Python, Node.js, React
- **💰 Zero Cost** — MIT license. No credit card. No usage limits.

---

## Quick Start

### 1. Add to Your Website (No Install)

```html
<script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch@main/src/vouch-shield.js"></script>
<script>
  const shield = new VouchShield({
    businessType: 'YOUR_BUSINESS',      // e.g. 'restaurant', 'clinic', 'store'
    businessDesc: 'WHAT_YOU_DO'         // e.g. 'Italian food in Mumbai'
  });

  const result = shield.check(userMessage);

  if (result.blocked) {
    showReply(result.response);        // Instant block — no API call
  } else {
    callYourAI(userMessage);           // Safe — send to LLM
  }
</script>
```

### 2. Self-Host Backend (Vercel)

```bash
# 1. Fork this repo
# 2. Add ONE env variable in Vercel:
AI_API_KEY=your_key_here   # Any provider: OpenRouter, Groq, OpenAI, Gemini, Anthropic
# 3. Deploy — done.
```

**Backend API:**
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    businessType: 'YOUR_BUSINESS',
    businessDesc: 'WHAT_YOU_DO',
    shieldEnabled: true        // false = direct AI, no block
  })
});
```

---

## Works With Any AI Provider

Paste any key. We handle the rest.

| Provider | Key Prefix | Example Model |
|----------|-----------|---------------|
| **OpenRouter** | `sk-or-...` | `meta-llama/llama-3.1-8b-instruct` |
| **Groq** | `gsk_...` | `llama-3.1-8b-instant` |
| **Google Gemini** | `AIza...` | `gemini-1.5-flash-latest` |
| **Anthropic** | `sk-ant-...` | `claude-3-haiku-20240307` |
| **OpenAI** | `sk-...` | `gpt-3.5-turbo` |
| **Together AI** | `...` | `meta-llama/Llama-3.1-8B-Instruct-Turbo` |
| **Local / Ollama** | none | `llama3` |

---

## Usage Examples

### HTML / Vanilla JS
```html
<script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch@main/src/vouch-shield.js"></script>
<script>
  const shield = new VouchShield({
    businessType: 'clinic',
    businessDesc: 'Dental care in Delhi',
    strictMode: true,
    customBlockList: ['bitcoin', 'crypto']
  });

  const result = shield.check("Who are you?");
  console.log(result.blocked);   // true
  console.log(result.response);  // "I can only help with our clinic services..."
</script>
```

### Python
```python
from vouch_shield import VouchShield

shield = VouchShield(
    business_type="ecommerce",
    business_desc="Electronics store online"
)

result = shield.check("Python code for calculator")
print(result["blocked"])   # True
print(result["response"])  # "I can only help with our ecommerce services..."
```

### Node.js
```javascript
const { VouchShield } = require('shield-by-vouch');

const shield = new VouchShield({
  businessType: 'hosting',
  businessDesc: 'Cloud VPS and domain services'
});

const result = shield.check("Tell me a joke");
if (result.blocked) {
  console.log("🛡️ Blocked:", result.response);
}
```

### React
```jsx
import { VouchShield } from 'shield-by-vouch';

const shield = new VouchShield({ businessType: 'salon' });

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

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User types  │────▶│ 🛡️ Shield JS │────▶│  BLOCKED?   │
│  message    │     │  (browser)   │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              🔴 YES — Blocked          🟢 NO — Safe
                              No API call               Send to backend
                              $0.00 spent               AI reply returned
```

| Layer | What It Blocks |
|-------|---------------|
| **1. Keyword Filter** | Code requests, identity questions, off-topic topics |
| **2. Pattern Match** | "Ignore previous", "DAN", "jailbreak", injection attempts |
| **3. AI Guard** | Strict system prompt + backend validation |

---

## Project Structure

```
shield-by-vouch/
├── demo/
│   ├── index.html           # 🌐 Marketing demo (side-by-side comparison)
│   └── test-chatbot.html    # 🤖 Live chatbot with Shield ON/OFF toggle
├── src/
│   ├── vouch-shield.js      # 📦 JavaScript library
│   └── vouch-shield.py      # 🐍 Python library
├── api/
│   └── chat.js              # ⚡ Vercel API (Universal Gateway + Auto-Healing)
├── package.json
├── vercel.json
└── README.md
```

---

## Environment Variables

| Name | Required | Description |
|------|----------|-------------|
| `AI_API_KEY` | ✅ Yes | Your API key (any provider) |
| `AI_PROVIDER` | ❌ No | Provider name (auto-detected if empty) |
| `AI_MODEL` | ❌ No | Model name (uses fallback list if empty) |

---

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add some AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## License

**MIT** — free for personal & commercial use.

**Made with 🛡️ by Vouch**
