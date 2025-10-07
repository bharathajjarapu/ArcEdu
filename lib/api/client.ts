import type { ChatMessage, ChatSource, Quiz, Difficulty, Chunk } from "@/types";
import * as cache from "@/lib/data/cache";
import * as dedup from "@/lib/data/dedup";
import * as worker from "@/lib/process/worker";
import * as docs from "@/lib/storage/docs";
import * as sessions from "@/lib/storage/sessions";
import { simple as simpleHash } from "@/lib/data/hash";
import { group } from "@/lib/process/batch";
import { makeTitleFromNames, makeTitleFromText } from "@/lib/title";

const STREAM_PROGRESS_INTERVAL = 80;
let notesController: AbortController | null = null;
let slidesController: AbortController | null = null;

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readTextStream(
  response: Response,
  onProgress?: (text: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader");

  const decoder = new TextDecoder();
  let result = "";
  let lastEmit = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    result += text;

    if (onProgress && Date.now() - lastEmit >= STREAM_PROGRESS_INTERVAL) {
      onProgress(result);
      lastEmit = Date.now();
    }
  }

  if (onProgress) onProgress(result);
  return result;
}

export function cancelNotesGeneration() {
  notesController?.abort();
}

export function cancelSlidesGeneration() {
  slidesController?.abort();
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

async function ensureEmbeddedChunks(chunks: sessions.ChunkContext[]): Promise<sessions.ChunkContext[]> {
  const pendingBySession = new Map<string, sessions.ChunkContext[]>();

  for (const chunk of chunks) {
    if (chunk.embedding && chunk.embedding.length > 0) continue;
    const list = pendingBySession.get(chunk.sessionId) || [];
    list.push(chunk);
    pendingBySession.set(chunk.sessionId, list);
  }

  if (pendingBySession.size === 0) return chunks;

  const changed: Chunk[] = [];

  for (const [sessionId, sessionChunks] of pendingBySession) {
    const texts = sessionChunks.map((chunk) => chunk.text);
    const hashes = sessionChunks.map((chunk) => chunk.hash || simpleHash(chunk.text));
    const textBatches = group(texts, 25);
    const hashBatches = group(hashes, 25);
    let chunkIndex = 0;

    for (let batchIndex = 0; batchIndex < textBatches.length; batchIndex++) {
      const { embeddings } = await embedBatch(sessionId, textBatches[batchIndex], hashBatches[batchIndex]);
      for (let i = 0; i < embeddings.length; i++) {
        const chunk = sessionChunks[chunkIndex];
        chunk.embedding = embeddings[i].embedding;
        chunk.hash = hashBatches[batchIndex][i];
        changed.push({
          id: chunk.id,
          sessionId: chunk.sessionId,
          documentId: chunk.documentId,
          text: chunk.text,
          embedding: chunk.embedding,
          index: chunk.index,
          hash: chunk.hash,
        });
        chunkIndex++;
      }
    }
  }

  await docs.saveChunks(changed);
  return chunks;
}

export async function chatWithSessions(
  message: string,
  history: Array<Pick<ChatMessage, "role" | "content">>,
  sessionIds: string[] = [],
): Promise<{ answer: string; sources: ChatSource[] }> {
  const scopeIds = sessionIds.length > 0
    ? sessionIds
    : (await sessions.getAll()).map((session) => session.id);

  if (scopeIds.length === 0) {
    return {
      answer: "No saved sessions found yet. Upload documents first, then ask me questions about them.",
      sources: [],
    };
  }

  const chunkContexts = await sessions.getChunkContexts(scopeIds);
  if (chunkContexts.length === 0) {
    return {
      answer: "I couldn't find any saved document content in the selected sessions yet.",
      sources: [],
    };
  }

  const embedded = await ensureEmbeddedChunks(chunkContexts);
  const queryEmbedding = await embedText(message);
  const limit = Math.min(8, embedded.length);
  const ranked = await worker.findSimilar(
    queryEmbedding,
    embedded.map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      embedding: chunk.embedding,
    })),
    limit,
  );

  const chunkMap = new Map(embedded.map((chunk) => [chunk.id, chunk]));
  const seenSources = new Set<string>();
  const sources: ChatSource[] = [];
  const contextBlocks: string[] = [];

  for (const result of ranked) {
    if (!result.id) continue;
    const chunk = chunkMap.get(result.id);
    if (!chunk) continue;

    contextBlocks.push(
      [
        `Session: ${chunk.sessionTitle}`,
        `Document: ${chunk.documentName}`,
        `Excerpt: ${chunk.text}`,
      ].join("\n"),
    );

    const sourceKey = `${chunk.sessionId}:${chunk.documentId}`;
    if (!seenSources.has(sourceKey)) {
      seenSources.add(sourceKey);
      sources.push({
        sessionId: chunk.sessionId,
        sessionTitle: chunk.sessionTitle,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        chunkId: chunk.id,
        score: result.score,
      });
    }
  }

  if (contextBlocks.length === 0) {
    return {
      answer: "I couldn't find relevant saved content for that question.",
      sources: [],
    };
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.slice(-8),
      context: contextBlocks.join("\n\n---\n\n"),
      scopeLabel: sessionIds.length > 0 ? `${sessionIds.length} selected session(s)` : "all saved sessions",
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to generate chat answer");
  }

  const answer = await readTextStream(response);
  return { answer: answer.trim(), sources };
}

export async function generateQuiz(
  topic: string,
  num: number,
  chunks?: any[],
  difficulty: Difficulty = "medium",
  prompt?: string,
  timeLimit?: number,
  onProgress?: (quiz: Quiz) => void,
): Promise<Quiz[]> {
  let context = "";

  if (chunks && chunks.length > 0) {
    const searchQuery = prompt?.trim() || topic;
    const queryEmbedding = await embedText(searchQuery);
    const relevant = await worker.findSimilar(queryEmbedding, chunks, 5);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, context, difficulty, prompt, timeLimit }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to generate quiz");
  }

  const { parseStream } = await import("@/lib/api/parser");
  return parseStream<Quiz>(response, num, onProgress);
}

export async function generateNotes(
  topic: string,
  chunks: any[],
  notesFormat: string,
  notesLength: string,
  codeEnabled: boolean,
  formulasEnabled: boolean,
  diagramsEnabled: boolean,
  tablesEnabled: boolean,
  prompt?: string,
  onProgress?: (text: string) => void,
): Promise<string> {
  let context = "";

  if (chunks.length > 0) {
    const searchQuery = prompt?.trim() || topic;
    const queryEmbedding = await embedText(searchQuery);
    const relevant = await worker.findSimilar(queryEmbedding, chunks, 8);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  notesController?.abort();
  const controller = new AbortController();
  notesController = controller;

  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context, notesFormat, notesLength, codeEnabled, formulasEnabled, diagramsEnabled, tablesEnabled, prompt }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to generate notes");
    }

    return await readTextStream(response, onProgress);
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error("Generation cancelled");
    }
    throw error;
  } finally {
    if (notesController === controller) {
      notesController = null;
    }
  }
}

export async function generateSlides(
  topic: string,
  chunks: any[],
  numSlides: number,
  slideDesign: string,
  codeEnabled: boolean,
  formulasEnabled: boolean,
  tablesEnabled: boolean,
  prompt?: string,
  onProgress?: (text: string) => void,
): Promise<string> {
  let context = "";

  if (chunks.length > 0) {
    const searchQuery = prompt?.trim() || topic;
    const queryEmbedding = await embedText(searchQuery);
    const relevant = await worker.findSimilar(queryEmbedding, chunks, 8);
    context = relevant.map((r) => r.text).join("\n\n");
  }

  slidesController?.abort();
  const controller = new AbortController();
  slidesController = controller;

  try {
    const response = await fetch("/api/slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context, numSlides, slideDesign, codeEnabled, formulasEnabled, tablesEnabled, prompt }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to generate slides");
    }

    return await readTextStream(response, onProgress);
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error("Generation cancelled");
    }
    throw error;
  } finally {
    if (slidesController === controller) {
      slidesController = null;
    }
  }
}

export async function generateTitle(content: string | string[]): Promise<string> {
  if (Array.isArray(content)) {
    return makeTitleFromNames(content);
  }
  return makeTitleFromText(content);
}
