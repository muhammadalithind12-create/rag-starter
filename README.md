# SupportGenius

**AI support chatbot that answers from your docs — with citations.**

SupportGenius is a production-style RAG (retrieval-augmented generation) customer-support chatbot. Point it at your help articles, and it answers customer questions grounded in your documentation — every answer citing the exact articles it used, and politely declining anything outside your docs.

**Live demo:** `https://your-deployment.vercel.app` *(deploy and replace this link)*

**Stack:** Next.js 16 · React 19 · Supabase pgvector · Google Gemini (chat + embeddings) · Tailwind CSS 4

---

## How it works

```
Your docs → Chunking (800 chars, 200 overlap) → Gemini embeddings (gemini-embedding-001 (768d))
→ Supabase pgvector (HNSW cosine index) → Top-5 similarity retrieval
→ Gemini 3.5 Flash-Lite answer + citations → Scope guardrail
```

## Features

- **Grounded answers with citations** — every response links the help articles it was built from
- **Scope enforcement** — refuses off-topic questions instead of hallucinating
- **Conversational memory** — follows up naturally using the last 6 turns of chat history
- **Document ingestion pipeline** — crawl live URLs or bulk-load a JSON knowledge base (`npm run ingest`)
- **One-file customization** — brand, tone, suggested questions, and model settings all live in `rag.config.ts`
- **Zero-cost AI** — runs entirely on Gemini's free tier (no OpenAI billing required)

## Demo knowledge base

The repo ships with `scripts/demo-docs.json`: 10 realistic help articles for **Nexora**, a fictional team-collaboration SaaS (getting started, pricing, Slack & Google integrations, roles & permissions, login troubleshooting, data export, keyboard shortcuts, SSO/security, mobile app). Load it with:

```bash
npm run ingest -- --json scripts/demo-docs.json
```

Then ask things like *"How does the Slack integration work?"* or *"What do the pricing plans include?"* and watch the citations appear.

## Getting started

### 1. Database

In the [Supabase SQL editor](https://supabase.com/dashboard), run `scripts/setup-supabase.sql` (creates the `vector` extension, the `documents` table, the HNSW index, and the `match_documents()` function).

> **Migrating from the OpenAI version?** Run `scripts/migrate-to-gemini.sql` instead — it resizes embeddings from 1536 to 768 dimensions and recreates the search function. (The table must be empty or re-ingested; vectors can't be cast across dimensions.)

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API |
| `GEMINI_API_KEY` | Free at [Google AI Studio](https://aistudio.google.com) |

### 3. Ingest docs & run

```bash
npm install
npm run ingest -- --json scripts/demo-docs.json  # load the Nexora demo KB
npm run dev                                       # open http://localhost:3000
```

### 4. Deploy

Deploy to Vercel and set the same three environment variables in the project settings. No build-time secrets required.

## Project structure

```
rag.config.ts            # Brand, prompts, suggested questions, model settings
src/app/api/chat/route.ts    # Chat endpoint: retrieve → generate → respond
src/app/api/ingest/route.ts  # HTTP ingestion endpoint
src/app/api/stats/route.ts   # Knowledge-base stats endpoint
src/lib/embeddings.ts    # Gemini gemini-embedding-001 (768d), single + batch
src/lib/retriever.ts     # pgvector cosine-similarity retrieval
src/lib/llm.ts           # Gemini 3.5 Flash-Lite chat with system instruction + history
src/lib/chunker.ts       # Sentence-aware chunking with overlap
src/components/ChatWindow.tsx  # Polished chat UI
scripts/ingest-docs.ts   # CLI ingestion (URLs, URL files, or JSON)
scripts/demo-docs.json   # 10-article Nexora demo knowledge base
scripts/setup-supabase.sql     # Fresh database setup
scripts/migrate-to-gemini.sql # OpenAI → Gemini migration
```

## Customization

Everything customer-facing lives in `rag.config.ts`: chatbot name, tagline, domain description, system prompt, suggested questions, input placeholder, disclaimer, out-of-scope message, LLM model/temperature/max tokens, retrieval top-K and similarity threshold, and chunking size/overlap. Point the ingester at your own docs and you're live.

## Attribution

SupportGenius was built on top of [rag-starter](https://github.com/abhipaddy8/rag-starter) by Abhishek Padiyar (MIT License — see `LICENSE`), which provided the initial project scaffolding and RAG pipeline structure. Since the fork, the project has been substantially customized: the LLM provider was migrated from OpenAI to Google Gemini (new embedding + chat modules), the database schema migrated to 768-dimension vectors, the UI redesigned, the configuration rebranded with a refined support-assistant persona, a 10-article demo knowledge base authored, JSON ingestion added to the CLI, and this documentation rewritten.

## License

MIT — see [LICENSE](./LICENSE).
