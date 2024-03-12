let chunkWorker: Worker | null = null;
let similarityWorker: Worker | null = null;
let msgId = 0;
const pending = new Map<number, (data: any) => void>();

export function initWorkers() {
  if (typeof window === "undefined") return;

  if (!chunkWorker) {
    chunkWorker = new Worker(new URL("../../workers/chunk.ts", import.meta.url));
    chunkWorker.onmessage = (e) => {
      const { id, chunks } = e.data;
      const resolve = pending.get(id);
      if (resolve) {
        resolve(chunks);
        pending.delete(id);
      }
    };
  }

  if (!similarityWorker) {
    similarityWorker = new Worker(
      new URL("../../workers/similarity.ts", import.meta.url),
    );
    similarityWorker.onmessage = (e) => {
      const { id, results } = e.data;
      const resolve = pending.get(id);
      if (resolve) {
        resolve(results);
        pending.delete(id);
      }
    };
  }
}

export function chunkText(
  text: string,
  size?: number,
  overlap?: number,
): Promise<string[]> {
  return new Promise((resolve) => {
    if (!chunkWorker) initWorkers();
    const id = msgId++;
    pending.set(id, resolve);
    chunkWorker?.postMessage({ id, text, size, overlap });
  });
}

export function findSimilar(
  query: number[],
  items: Array<{ embedding: number[]; text: string; id?: string }>,
  k: number = 5,
): Promise<Array<{ text: string; score: number; id?: string }>> {
  return new Promise((resolve) => {
    if (!similarityWorker) initWorkers();
    const id = msgId++;
    pending.set(id, resolve);
    similarityWorker?.postMessage({ id, query, items, k });
  });
}

export function terminate() {
  chunkWorker?.terminate();
  similarityWorker?.terminate();
  chunkWorker = null;
  similarityWorker = null;
  pending.clear();
}
