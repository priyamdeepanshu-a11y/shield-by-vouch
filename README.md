&lt;h1 align="center"&gt;🛡️ Shield by Vouch&lt;/h1&gt;
&lt;h3 align="center"&gt;Lock Your AI Chatbot to Its Business. Nothing Else.&lt;/h3&gt;

&lt;p align="center"&gt;
  &lt;b&gt;Zero Cost · Open Source · 3-Layer AI Protection&lt;/b&gt;
&lt;/p&gt;

&lt;p align="center"&gt;
  &lt;a href="https://shield-by-vouch.vercel.app"&gt;🔥 Try Live Demo&lt;/a&gt; •
  &lt;a href="#quick-start"&gt;⚡ 2-Min Setup&lt;/a&gt; •
  &lt;a href="#how-it-works"&gt;🛡️ How It Works&lt;/a&gt;
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

### Use In Your Project

**HTML Website:**
```html
&lt;script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch/src/vouch-shield.js"&gt;&lt;/script&gt;
&lt;script&gt;
  const shield = new VouchShield({ businessType: 'restaurant' });
  const result = shield.check(userMessage);
  if (result.blocked) return result.response; // No API call!
&lt;/script&gt;
