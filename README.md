&lt;h1 align="center"&gt;
  &lt;span style="color:#00ff41"&gt;🛡️ SHIELD&lt;/span&gt; &lt;span style="color:#888"&gt;by Vouch&lt;/span&gt;
&lt;/h1&gt;

&lt;h3 align="center"&gt;Lock Your AI Chatbot to Its Business. Nothing Else.&lt;/h3&gt;

&lt;p align="center"&gt;
  &lt;b&gt;Zero Cost · Open Source · 3-Layer AI Protection&lt;/b&gt;
&lt;/p&gt;

&lt;p align="center"&gt;
  &lt;a href="https://shield-by-vouch.vercel.app"&gt;🔥 Try Live Demo&lt;/a&gt; •
  &lt;a href="#quick-start"&gt;⚡ 2-Min Setup&lt;/a&gt; •
  &lt;a href="#how-it-works"&gt;🛡️ How It Works&lt;/a&gt; •
  &lt;a href="#examples"&gt;💻 Code Examples&lt;/a&gt;
&lt;/p&gt;

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

### Try Live Demo (No Code Required)
👉 **[shield-by-vouch.vercel.app](https://shield-by-vouch.vercel.app)**

1. Select your business type
2. Describe your business (100 characters min)
3. Chat with AI — off-topic messages auto-blocked

---

## 💻 Code Examples

### HTML Website (No Build Step)

```html
&lt;!-- Add this BEFORE your chatbot code --&gt;
&lt;script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch/src/vouch-shield.js"&gt;&lt;/script&gt;

&lt;script&gt;
  const shield = new VouchShield({ 
    businessType: 'restaurant',
    businessName: 'Pizza Palace' 
  });

  // Wrap your existing send function
  function sendToAI(userMessage) {
    const result = shield.check(userMessage);
    
    if (result.blocked) {
      showReply(result.response); // Blocked! No API call made
      return;
    }
    
    // Your existing OpenAI / Groq / Claude API call here...
    callYourLLM(userMessage);
  }
&lt;/script&gt;
