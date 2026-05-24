# ⚡ AlgoPath — DSA Learning Platform

Master Data Structures & Algorithms with interactive visualizers, NeetCode 150 tracker, and AI-powered solutions.

## Features
- 🎯 **9 interactive visualizers** — Arrays, Linked List, Stack, Queue, Hash Map, Binary Tree, Heap, Trie, Graph
- 🧠 **16 algorithm patterns** — with animated demonstrations
- 📋 **NeetCode 150 tracker** — all 150 problems with progress persistence
- 🤖 **AI solutions** — NVIDIA, OpenAI, Anthropic, Gemini (switch at runtime)
- 📊 **Progress dashboard** — streaks, badges, heatmap, notes, bookmarks
- 🔍 **Full search** — across all problems, patterns, and topics
- 💾 **100% local** — no login, no server, localStorage only
- 📱 **Mobile responsive**

## Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/learn` | DSA platform with visualizers |
| `/solutions` | Solution explorer with AI |
| `/dashboard` | Progress tracker |

## Deploy to Vercel (2 minutes)

### Option A — GitHub (recommended)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel auto-detects Next.js — click **Deploy**
4. Done! Live in ~60 seconds.

### Option B — Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts — select defaults for everything
```

### Option C — Drag & Drop
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag the entire `algopath` folder onto the page
3. Click Deploy

## Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Tech Stack
- **Next.js 14** (Pages Router)
- **React 18**
- **Zero UI libraries** — everything hand-built
- **localStorage** for all persistence
- **Anthropic / OpenAI / NVIDIA / Gemini APIs** (client-side, keys never stored)

## Notes
- The Google Fonts stylesheet warning during build (`CssSyntaxError`) is harmless — it only appears in network-restricted environments. On Vercel it builds and loads fine.
- API keys for AI features are entered by the user at runtime and stored only in React state (cleared on refresh — intentional for security).
