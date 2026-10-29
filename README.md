# RAG Studio

A full-stack platform for building and deploying custom AI chat agents grounded in your own knowledge. Define an agent persona, ingest knowledge from URLs or text, and interact via a real-time streaming chat — all in one tool.

---

## How it works

```
User question
     │
     ▼
Decision LLM ──► Does system prompt reference a URL for this topic?
     │                        │
     │               Yes      │      No
     │               ▼        │      ▼
     │         Fetch URL      │  Search ChromaDB
     │         + index it     │  (vector similarity)
     │               │        │      │
     └───────────────┴────────┴──────┘
                     │
                     ▼
              Build context prompt
                     │
                     ▼
              Gemini LLM → streamed response (SSE)
```

**Auto-scraping:** If the agent's system prompt mentions a URL (e.g. `"For FAQ questions, see https://example.com/faq"`), the backend detects the intent at query time, fetches and indexes the page into ChromaDB automatically, then re-uses the cached version until it goes stale (`SCRAPE_MAX_AGE_DAYS`).

**Manual KB:** Users can also explicitly ingest URLs or paste text directly through the Knowledge Base page.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, TanStack Router (file-based), Vite 8 |
| Styling | CSS custom properties, Inter font, dark/light theme |
| Chat rendering | `react-markdown` for streamed markdown output |
| Resizable panels | `react-resizable-panels` v2 |
| Backend | FastAPI, Python 3.11+ |
| LLM | LangChain + `langchain-google-genai` (Gemini) |
| Vector store | ChromaDB (local persistent) |
| Embeddings | `gemini-embedding-001` |
| Auth DB | SQLite via `bcrypt` password hashing + token sessions |
| Streaming | Server-Sent Events (SSE) |

---

## Project structure

```
RAG/
├── api/
│   └── routes/          # FastAPI routers (auth, agents, kb, chat)
├── src/
│   ├── auth/            # User store, session management
│   ├── kb/              # Knowledge ingestion, scraping, vector search
│   ├── llm/             # Gemini LLM wrappers
│   └── config.py        # Env-driven config
├── web/                 # React frontend (TanStack Router)
│   └── src/
│       ├── routes/      # login, register, dashboard, agent, kb, play
│       └── components/  # shell (sidebar), chat-preview, theme toggle
├── .env.example         # Backend env template
├── web/.env.example     # Frontend env template
└── requirements.txt
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm (`npm i -g pnpm`)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (free tier works)

---

## Setup

### 1. Clone

```bash
git clone https://github.com/your-username/rag-studio.git
cd rag-studio
```

### 2. Backend environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-3.6-flash
DECISION_MODEL_NAME=gemini-3.1-flash-lite
SMALL_MODEL_NAME=gemini-3.5-flash-lite
SCRAPE_MAX_AGE_DAYS=7
```

**Get your Gemini API key:**
1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the key into `.env`

### 3. Python dependencies

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 4. Frontend environment

```bash
cd web
cp .env.example .env
```

The default `VITE_API_URL=http://127.0.0.1:8000` works for local development. Change it if your backend runs on a different port.

### 5. Frontend dependencies

```bash
# inside the web/ directory
pnpm install
```

---

## Running locally

Open **two terminals**:

**Terminal 1 — Backend**
```bash
# from project root, with venv active
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend**
```bash
cd web
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Usage

### 1. Register / Sign in
Create an account on the register page. Credentials are stored locally in SQLite.

### 2. Create an agent
Go to **Agent** in the sidebar. Give your agent a name and a system prompt.

**System prompt tips:**
- Describe what the agent does and what it knows
- Reference URLs directly for auto-scraping:
  ```
  You are a helpful assistant. For product FAQ, see https://example.com/faq.
  For pricing details, see https://example.com/pricing.
  ```
  The agent will fetch and index those pages automatically when a user asks about them.

### 3. Add knowledge (optional)
Go to **Knowledge** to manually ingest sources:
- **URL** — paste a public URL; the page is scraped and indexed immediately
- **Text** — paste any raw text (docs, notes, policy text, etc.)

### 4. Test in the Playground
Go to **Playground** to chat with your agent with full streaming responses and markdown rendering.

### 5. Live preview
On the **Agent** edit page, the right panel is a live chat widget. Save the agent to unlock the preview.

---

## Environment variables reference

### Backend (`.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `GEMINI_MODEL_NAME` | No | `gemini-2.0-flash` | Main chat model |
| `DECISION_MODEL_NAME` | No | same as `GEMINI_MODEL_NAME` | Routing/decision model (lighter = faster) |
| `SMALL_MODEL_NAME` | No | same as `GEMINI_MODEL_NAME` | Lightweight task model |
| `SCRAPE_MAX_AGE_DAYS` | No | `7` | Days before a cached URL is re-scraped |

### Frontend (`web/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://127.0.0.1:8000` | FastAPI backend URL |

---

## Data storage

All data is stored locally — no external database required:

| Path | Contents |
|---|---|
| `data/app.sqlite` | Users, sessions, agents |
| `data/scrape_log.sqlite` | URL scrape timestamps |
| `vector_db/chroma/` | ChromaDB vector embeddings |

These are excluded from git via `.gitignore`. Delete them to reset all data.

---

## Features

- **Auth** — Register/login with bcrypt-hashed passwords and token sessions
- **Agent builder** — Name + system prompt with resizable split-screen live preview
- **Knowledge base** — URL scraping + text ingestion into ChromaDB
- **Auto-scraping** — URLs referenced in system prompts are fetched on demand and cached
- **Freshness control** — Stale URLs are re-scraped after `SCRAPE_MAX_AGE_DAYS`
- **Streaming chat** — Real-time SSE streaming with markdown rendering
- **Dark / light theme** — Persisted via localStorage
- **Collapsible sidebar** — 240px expanded, 64px icon-only collapsed

---

## License

MIT
