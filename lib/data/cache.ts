import * as store from "../storage/store";
import type { Cache } from "@/types";

const TTL = 7 * 24 * 60 * 60 * 1000;

export async function get(
  sessionId: string,
  hash: string,
): Promise<number[] | null> {
  const cacheKey = `${sessionId}_${hash}`;
  const cached = await store.get<Cache>("cache", cacheKey);

  if (cached) {
    if (Date.now() - cached.createdAt > TTL) {
      await store.remove("cache", cacheKey);
      return null;
    }
    return cached.embedding;
  }

  const global = await store.get<Cache>("cache", `global_${hash}`);
  if (global && Date.now() - global.createdAt <= TTL) {
    await set(sessionId, hash, global.embedding);
    return global.embedding;
  }

  return null;
}

export async function set(
  sessionId: string,
  hash: string,
  embedding: number[],
): Promise<void> {
  const cacheKey = `${sessionId}_${hash}`;
  const cache: Cache = {
    hash: cacheKey,
    sessionId,
    embedding,
    createdAt: Date.now(),
  };
  await store.put("cache", cache);

  const globalKey = `global_${hash}`;
  const global = await store.get<Cache>("cache", globalKey);
  if (!global) {
    await store.put("cache", {
      hash: globalKey,
      sessionId: "global",
      embedding,
      createdAt: Date.now(),
    });
  }
}

export async function getMany(
  sessionId: string,
  hashes: string[],
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  for (const hash of hashes) {
    const embedding = await get(sessionId, hash);
    if (embedding) {
      map.set(hash, embedding);
    }
  }
  return map;
}

export async function setMany(
  sessionId: string,
  items: Array<{ hash: string; embedding: number[] }>,
): Promise<void> {
  for (const item of items) {
    await set(sessionId, item.hash, item.embedding);
  }
}

export async function has(sessionId: string, hash: string): Promise<boolean> {
  const cached = await get(sessionId, hash);
  return cached !== null;
}

export async function clear(sessionId: string): Promise<void> {
  const all = await store.getByIndex<Cache>("cache", "sessionId", sessionId);
  for (const item of all) {
    await store.remove("cache", item.hash);
  }
}
