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
  const results = await Promise.all(hashes.map((hash) => get(sessionId, hash)));
  const map = new Map<string, number[]>();
  results.forEach((embedding, index) => {
    if (embedding) {
      map.set(hashes[index], embedding);
    }
  });
  return map;
}

export async function setMany(
  sessionId: string,
  items: Array<{ hash: string; embedding: number[] }>,
): Promise<void> {
  if (items.length === 0) return;
  const now = Date.now();

  const globalKeys = items.map((item) => `global_${item.hash}`);
  const existingGlobals = await Promise.all(
    globalKeys.map((key) => store.get<Cache>("cache", key))
  );

  const newGlobals: Cache[] = [];
  items.forEach((item, index) => {
    if (!existingGlobals[index]) {
      newGlobals.push({
        hash: globalKeys[index],
        sessionId: "global",
        embedding: item.embedding,
        createdAt: now,
      });
    }
  });

  await store.putMany("cache", newGlobals);
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
