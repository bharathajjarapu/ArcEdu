import type { Quiz, Flashcard } from "@/types";
import * as cache from "@/lib/data/cache";
import * as dedup from "@/lib/data/dedup";
import { simple as simpleHash } from "@/lib/data/hash";
import { topK } from "@/lib/utils/similarity";

export async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload PDF");
  return response.json();
}

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
): Promise<Quiz[]> {
  let context = "";

  if (chunks && chunks.length > 0) {
    const queryEmbedding = await embedText(topic);
    const relevant = topK(queryEmbedding, chunks, 5);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, context }),
  });
  if (!response.ok) throw new Error("Failed to generate quiz");
  const data = await response.json();
  return data.quiz;
}

export async function generateFlashcards(
  topic: string,
  num: number,
  chunks?: any[],
): Promise<Flashcard[]> {
  let context = "";

  if (chunks && chunks.length > 0) {
    const queryEmbedding = await embedText(topic);
    const relevant = topK(queryEmbedding, chunks, 5);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, context }),
  });
  if (!response.ok) throw new Error("Failed to generate flashcards");
  const data = await response.json();
  return data.flashcards;
}

export async function generateTitle(content: string): Promise<string> {
  try {
    const response = await fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) return "New Session";
    const data = await response.json();
    return data.title || "New Session";
  } catch {
    return "New Session";
  }
}
