import * as store from "./store";
import type { Document, Chunk } from "@/types";

export async function create(
  sessionId: string,
  name: string,
  size: string,
  content: string,
): Promise<Document> {
  const doc: Document = {
    id: crypto.randomUUID(),
    sessionId,
    name,
    size,
    content,
    createdAt: Date.now(),
  };
  await store.put("documents", doc);
  return doc;
}

export async function getById(id: string): Promise<Document | null> {
  return store.get<Document>("documents", id);
}

export async function getBySession(sessionId: string): Promise<Document[]> {
  return store.getByIndex<Document>("documents", "sessionId", sessionId);
}

export async function remove(id: string): Promise<void> {
  const chunks = await store.getByIndex<Chunk>("chunks", "documentId", id);
  for (const chunk of chunks) {
    await store.remove("chunks", chunk.id);
  }
  await store.remove("documents", id);
}

export async function saveChunks(chunks: Chunk[]): Promise<void> {
  await store.putMany("chunks", chunks);
}

export async function getChunks(documentId: string): Promise<Chunk[]> {
  return store.getByIndex<Chunk>("chunks", "documentId", documentId);
}
