# ArcEdu

AI-powered learning app that transforms your documents into interactive study materials.

## What It Does

Upload PDFs or text files and generate:
- **Notes** – Structured summaries from your content
- **Flashcards** – Question/answer cards for memorization
- **Quizzes** – Multiple-choice tests with instant feedback

All processing happens locally with session-based management.

## Features

### Core
- Multi-document upload (PDF, TXT)
- Session-based organization
- Format selection (Notes, Flashcards, Quiz)
- Real-time generation with OpenAI
- Persistent local storage

### Performance
- Lazy embedding (on-demand only)
- Content deduplication via hashing
- Batch embedding API
- Request deduplication
- Web Workers for heavy processing
- Parallel PDF processing queue
- Streaming API responses

### Storage
- IndexedDB for sessions, documents, chunks
- Session-isolated embedding cache
- Global cross-session deduplication
- TTL-based cache expiry (7 days)
- No server-side storage

## How It Works

### 1. Upload & Chunking
- Extract text from PDFs (pdf-parse) or text files
- Split into semantic chunks (~500 tokens)
- Uses headings, blank lines, and heuristics
- Process in parallel with Web Workers
- Store chunks without embeddings

### 2. Session Management
- Each upload creates a session
- Sessions track documents and chunks
- Isolated embedding caches per session
- Sessions marked completed after generation

### 3. Lazy Embedding
- Embeddings generated only when needed
- Cache-first strategy (session → global)
- Batch API calls to OpenAI
- Content hashing prevents duplicate work
- TTL manages cache lifecycle

### 4. Retrieval
- Embed user query with OpenAI
- Load cached embeddings from IndexedDB
- Cosine similarity computed in Web Worker
- Return top-k relevant chunks

### 5. Generation
- Send retrieved chunks to OpenAI
- Format-specific prompts (notes/cards/quiz)
- Streaming response support
- Store results in session

### 6. Background Processing
- Chunking in Web Workers (non-blocking)
- Similarity search in Web Workers
- Queue-based PDF processing (concurrency=3)
- Batch embedding with deduplication

## Tech Stack

- Next.js (App Router) + React 19
- TypeScript + Tailwind
- OpenAI API (embeddings + chat)
- IndexedDB (local storage)
- Web Workers (processing)
- Bun runtime

## Implementation Details

### Storage Schema
```
sessions: {id, name, created, completed}
documents: {id, sessionId, name, content, type}
chunks: {id, sessionId, documentId, text, embedding, index, hash}
cache: {key, embedding, created, sessionId}
```

### Architecture
- Client-side chunking and retrieval
- Minimal backend (OpenAI proxy only)
- No external vector database
- Session-aware embedding cache
- Hash-based deduplication

### Utilities
- `lib/api` – OpenAI client wrappers
- `lib/data` – Chunking, embedding, retrieval
- `lib/process` – Workers, queue, batching
- `lib/storage` – IndexedDB layer
- `lib/utils` – Hash, dedup, batch helpers

## Setup

```bash
bun install
echo "OPENAI_API_KEY=your-key" > .env.local
bun run dev
```

## Usage

1. Upload documents (PDF/TXT)
2. Select format (Notes/Flashcards/Quiz)
3. Generate content
4. Review and interact
5. Access past sessions anytime