import type { Quiz, Flashcard, Difficulty } from "@/types";
import * as cache from "@/lib/data/cache";
import * as dedup from "@/lib/data/dedup";
import * as worker from "@/lib/process/worker";
import { makeTitleFromNames, makeTitleFromText } from "@/lib/title";

export async function embedText(text: string): Promise<number[]> {
  const response = await fetch("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text] }),
  });
  if (!response.ok) throw new Error("Failed to embed text");
  const data = await response.json();
  return data.embeddings[0].embedding;
}

export async function embedBatch(
  sessionId: string,
  texts: string[],
  hashes: string[],
) {
  const cached = await cache.getMany(sessionId, hashes);
  const needsApi: string[] = [];
  const needsApiHashes: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    if (!cached.has(hashes[i])) {
      needsApi.push(texts[i]);
      needsApiHashes.push(hashes[i]);
    }
  }

  if (needsApi.length > 0) {
    const dedupKey = `embed_${sessionId}_${needsApiHashes.join(",")}`;
    const data = await dedup.call(dedupKey, async () => {
      const response = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: needsApi }),
      });
      if (!response.ok) throw new Error("Failed to embed texts");
      return response.json();
    });

    const items = needsApi.map((_, i) => ({
      hash: needsApiHashes[i],
      embedding: data.embeddings[i].embedding,
    }));
    await cache.setMany(sessionId, items);
    for (const item of items) cached.set(item.hash, item.embedding);
  }

  return { embeddings: hashes.map((h) => ({ embedding: cached.get(h)! })) };
}

export async function generateQuiz(
  topic: string,
  num: number,
  chunks?: any[],
  difficulty: Difficulty = "medium",
  onProgress?: (quiz: Quiz) => void,
): Promise<Quiz[]> {
  let context = "";

  if (chunks && chunks.length > 0) {
    const queryEmbedding = await embedText(topic);
    const relevant = await worker.findSimilar(queryEmbedding, chunks, 5);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, context, difficulty }),
  });

  if (!response.ok) throw new Error("Failed to generate quiz");

  const { parseStream } = await import("@/lib/api/parser");
  return parseStream<Quiz>(response, num, onProgress);
}

export async function generateFlashcards(
  topic: string,
  num: number,
  chunks?: any[],
  difficulty: Difficulty = "medium",
  onProgress?: (flashcard: Flashcard) => void,
): Promise<Flashcard[]> {
  let context = "";

  if (chunks && chunks.length > 0) {
    const queryEmbedding = await embedText(topic);
    const relevant = await worker.findSimilar(queryEmbedding, chunks, 5);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, context, difficulty }),
  });

  if (!response.ok) throw new Error("Failed to generate flashcards");

  const { parseStream } = await import("@/lib/api/parser");
  return parseStream<Flashcard>(response, num, onProgress);
}

export async function generateTitle(content: string | string[]): Promise<string> {
  if (Array.isArray(content)) {
    return makeTitleFromNames(content);
  }
  return makeTitleFromText(content);
}