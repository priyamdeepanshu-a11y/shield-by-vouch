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

**Step 1:** Copy this code and paste it in your HTML file (inside `&lt;body&gt;` tag):

```html
&lt;script src="https://cdn.jsdelivr.net/gh/priyamdeepanshu-a11y/shield-by-vouch@main/src/vouch-shield.js"&gt;&lt;/script&gt;
&lt;script&gt;
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
&lt;/script&gt;
🟡 Option B: Python
Step 1: Download the file. Open your terminal and type:
curl -O https://raw.githubusercontent.com/priyamdeepanshu-a11y/shield-by-vouch/main/src/vouch-shield.py
Step 2: In your Python file, paste this:
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
