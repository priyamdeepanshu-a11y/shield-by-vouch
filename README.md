<p align="center">
  <svg width="80" height="80" viewBox="0 0 100 100">
    <polygon points="50,8 90,28 90,62 50,92 10,62 10,28" fill="none" stroke="#00ff41" stroke-width="4"/>
    <path d="M28 52 L44 68 L72 36" fill="none" stroke="#00ff41" stroke-width="7" stroke-linecap="round"/>
  </svg>
</p>

<h1 align="center">🛡️ Shield by Vouch</h1>
<h3 align="center">Lock Your AI Chatbot to Its Business. Nothing Else.</h3>

<p align="center">
  <b>Zero Cost · Open Source · 3-Layer Protection</b><br>
  Block off-topic questions, prompt injection & identity leaks instantly.
</p>

<p align="center">
  <a href="#live-demo">🔥 Try Live Demo</a> •
  <a href="#what-it-does">🛡️ Features</a> •
  <a href="#setup-in-2-minutes">⚡ 2-Min Setup</a> •
  <a href="#how-to-use">💻 Developer Guide</a>
</p>

---

## 🎬 What It Does

**Shield by Vouch** is a free, open-source security layer that sits in front of your AI chatbot (ChatGPT, Groq, Claude, etc.) and ensures it **only talks about your business**.

| User Attack | Shield Action | Result |
|-------------|---------------|--------|
| `"Python code batao"` | 🔴 **BLOCKED** — Code detected | API token saved |
| `"Ignore previous instructions"` | 🔴 **BLOCKED** — Injection caught | System safe |
| `"Who are you? Which AI?"` | 🔴 **BLOCKED** — Identity protected | Brand safe |
| `"Tell me a joke"` | 🔴 **BLOCKED** — Off-topic | No hallucination |
| `"I want to order a pizza"` | 🟢 **ALLOWED** — Business related | Normal AI reply |

---

## 🚀 Live Demo

👉 **[Click Here to Try Shield by Vouch](https://shield-by-vouch.vercel.app)**

No signup required. Just select your business type, describe your business in 100 words, and start chatting. Try asking off-topic questions — see Shield block them in real-time!

---

## 🛡️ 3-Layer Protection Explained

```
User Message
     ↓
┌─────────────────┐
│  LAYER 1        │  Input Guard (3ms)
│  Input Guard    │  → Blocks off-topic, injection, identity probes
└────────┬────────┘
         │ ALLOWED
┌────────▼────────┐
│  LAYER 2        │  Hard System Prompt
│  Hard Prompt    │  → Injects strict business-only rules into AI
└────────┬────────┘
         │ AI RESPONSE
┌────────▼────────┐
│  LAYER 3        │  Output Guard (2ms)
│  Output Guard   │  → Strips "As an AI", "OpenAI", code blocks
└─────────────────┘
         ↓
   Clean Reply to User
```

| Layer | What It Blocks | Speed |
|-------|---------------|-------|
| **Input Guard** | Code, science, jokes, injection, identity questions | 3ms |
| **Hard Prompt** | AI going off-topic via system instructions | 0ms |
| **Output Guard** | "As an AI", company names, leaked code blocks | 2ms |

**Total overhead: 5ms.** User feels no difference.

---

## ⚡ Setup in 2 Minutes (For Developers)

### Option A: Copy-Paste in HTML Website (No Build)

```html
<!-- Step 1: Add this script tag BEFORE your chatbot code -->
<script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch/src/vouch-shield.js"></script>

<script>
  // Step 2: Create Shield (ONE line)
  const shield = new VouchShield({ 
    businessType: 'restaurant',
    businessName: 'Pizza Palace'
  });

  // Step 3: Wrap your send function
  function sendToAI(userMessage) {
    const result = shield.check(userMessage);

    if (result.blocked) {
      showBotReply(result.response);  // Blocked! No API call made
      console.log('API token saved!');
      return;
    }

    // Your existing OpenAI / Groq call here...
    callOpenAI(userMessage);
  }
</script>
```

### Option B: Python (Flask / FastAPI / Django)

```bash
pip install vouch-shield
```

```python
from vouch_shield import Shield

shield = Shield(business_type="restaurant", business_name="Pizza Palace")

@app.route("/chat", methods=["POST"])
def chat():
    result = shield.check(request.json["message"])

    if result.blocked:
        return {"reply": result.response}  # No API call!

    # Your existing LLM call here...
    response = openai.ChatCompletion.create(...)
    clean = shield.clean_output(response)
    return {"reply": clean}
```

### Option C: Node.js (Express)

```bash
npm install vouch-shield
```

```javascript
const { VouchShield } = require('vouch-shield');
const shield = new VouchShield({ businessType: 'restaurant' });

app.post('/chat', (req, res) => {
  const result = shield.check(req.body.message);
  if (result.blocked) return res.json({ reply: result.response });
  // Your existing LLM call...
});
```

---

## 🏢 Supported Business Types

- 🍕 **Restaurant / Food Delivery**
- 🏥 **Medical / Clinic / Hospital**
- 🏦 **Banking / Finance / Insurance**
- 🌐 **Web Hosting / IT Services**
- 🛒 **E-Commerce / Online Store**
- 📚 **Education / Coaching / School**
- 💈 **Salon / Spa / Wellness**
- 🏠 **Real Estate / Property**
- ⚙️ **Custom** (Any business)

---

## 💡 Why Use Shield by Vouch?

| Problem | Without Shield | With Shield |
|---------|---------------|-------------|
| User asks "Python code" | Bot answers → wastes API tokens | 🔴 Blocked instantly → $0 cost |
| User asks "Who are you?" | Bot says "I'm ChatGPT by OpenAI" | 🔴 Blocked → Says your business name |
| "Ignore previous instructions" | Bot follows new instructions | 🔴 Blocked → System safe |
| Off-topic science questions | Bot hallucinates answers | 🔴 Blocked → Stays on topic |

---

## 🌐 Deploy Your Own Demo (Vercel)

Want your own branded demo page? Deploy in 30 seconds:

### Step 1: Fork this Repository
Click the **Fork** button on top-right of this page.

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"**
3. Select your forked `shield-by-vouch` repo
4. Click **Deploy**

### Step 3: Add Your API Key
1. In Vercel Dashboard → Go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add:
   - **Name:** `GROQ_API_KEY`
   - **Value:** `gsk_your_groq_api_key_here`
4. Click **Save** → Click **Redeploy**

✅ Done! Your live URL will be: `https://your-name.vercel.app`

**Get free Groq API key:** [console.groq.com/keys](https://console.groq.com/keys)

---

## 📁 Project Structure

```
shield-by-vouch/
├── README.md              ← This file
├── .gitignore             ← Files to ignore
├── vercel.json            ← Vercel routing config
├── api/
│   └── chat.js            ← Backend API (calls Groq AI)
├── demo/
│   └── index.html         ← Live demo website
└── src/
    ├── vouch-shield.js    ← JavaScript library
    └── vouch-shield.py    ← Python library
```

---

## 🧪 Testing Locally

### Test JavaScript Library (Browser)

Open `demo/index.html` in any browser. No server needed.

Or create a test file:
```html
<script src="src/vouch-shield.js"></script>
<script>
  const shield = new VouchShield({ businessType: 'restaurant' });
  console.log(shield.check('Python code batao'));  // blocked: true
  console.log(shield.check('Pizza order karna hai'));  // blocked: false
</script>
```

### Test Python Library

```python
from src.vouch_shield import Shield

shield = Shield(business_type='restaurant')
print(shield.check('Python code batao').blocked)  # True
print(shield.check('Pizza order').blocked)        # False
```

---

## 🤝 Who Is This For?

- **Startup Founders** — Protect your AI customer support bot
- **Agencies** — Deliver topic-locked bots to clients
- **Developers** — Save API costs by blocking junk queries
- **No-Code Builders** — Paste one script tag, done
- **Students** — Learn AI security & prompt engineering

---

## 🏆 SEO Keywords

AI chatbot topic enforcement, prevent off-topic chatbot responses, chatbot guardrail, prompt injection protection, AI identity leak fix, free chatbot security tool, lock chatbot to business, chatbot topic filter, AI moderation tool, Groq chatbot guard, OpenAI topic lock, Claude business bot, no-code chatbot protection, JavaScript chatbot filter, Python chatbot security.

---

## 💚 License

**MIT License** — Free for personal and commercial use forever.

Made with 💚 by **Vouch**

---

<p align="center">
  <b>⭐ Star this repo if it helped you!</b><br>
  <b>🍴 Fork it to create your own version!</b>
</p>
