# ArcEdu

AI-powered learning app that turns your documents into study notes, quizzes and slides.

## How It Works

1. **Upload** – files go to `/api/parse`, where [AnyDoc](https://github.com/firecrawl/anydoc) converts PDF, Word, PowerPoint, Excel, OpenDocument, RTF, EPUB and CSV to markdown (TXT and MD pass through). The markdown is saved in the browser's IndexedDB.
2. **Retrieve** – a Web Worker splits each document into ~1,200-character chunks and embeds them locally with [mdbr-leaf-ir](https://huggingface.co/MongoDB/mdbr-leaf-ir) (int8 ONNX on onnxruntime-web, loaded from a pinned CDN and cached). A focus prompt is matched with hybrid search: BM25 keywords plus dense vectors, merged by reciprocal rank fusion. Without one, chunks are spread evenly across the material.
3. **Generate** – the retrieved markdown goes to `/api/generate` with your options. It builds a format-specific prompt and streams the answer from any OpenAI-compatible LLM.
4. **Study** – quizzes stream in question by question, notes render with KaTeX and mermaid, and slides can be presented fullscreen. Everything is saved per session in the browser; the server stores nothing.

## Setup

```bash
bun install
cat > .env.local <<EOF
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4.1-mini
LLM_KEY=your-key
EOF
bun run dev
```

## Stack

Next.js 16 (App Router, Turbopack, Cache Components), React 19, Tailwind CSS 4, Base UI with shadcn styling, AnyDoc, marked and KaTeX.
