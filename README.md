# Ahmed AI 🤖 — Powered by Groq (Free!)

Advanced futuristic AI assistant for Android. Uses **Llama 3.3 70B** via Groq API — completely free!

## 🚀 Deploy to GitHub + Netlify (Android)

### Step 1 — Get Free Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Go to **API Keys → Create API Key**
4. Copy the key

### Step 2 — Upload to GitHub
1. Go to [github.com](https://github.com) → Create new repo: `ahmed-ai`
2. Upload files with these exact paths:
   - `index.html`
   - `netlify.toml`
   - `README.md`
   - `css/style.css`
   - `js/app.js`
   - `netlify/functions/chat.js`

### Step 3 — Deploy on Netlify
1. [netlify.com](https://netlify.com) → **Add new site → Import from GitHub**
2. Select `ahmed-ai` repo
3. Leave build settings blank
4. Click **Deploy**

### Step 4 — Add API Key
1. Netlify Dashboard → **Site configuration → Environment variables**
2. Add variable:
   - Key: `GROQ_API_KEY`
   - Value: your key from Step 1
3. **Redeploy** → Done! ✅

## 📁 File Structure
```
ahmed-ai/
├── index.html
├── netlify.toml
├── README.md
├── css/style.css
├── js/app.js
└── netlify/functions/chat.js
```

## ✅ Free Limits (Groq)
- 14,400 requests/day
- 30 requests/minute
- Completely free, no credit card needed
