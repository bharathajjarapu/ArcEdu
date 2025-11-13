let chunkWorker: Worker | null = null;
let similarityWorker: Worker | null = null;
let msgId = 0;
const pending = new Map<number, {
  resolve: (data: any) => void;
  reject: (error: Error) => void;
}>();

function failPending(message: string) {
  for (const { reject } of pending.values()) {
    reject(new Error(message));
  }
  pending.clear();
}

export function initWorkers() {
  if (typeof window === "undefined") return;

  if (!chunkWorker) {
    chunkWorker = new Worker(new URL("../../workers/chunk.ts", import.meta.url));
    chunkWorker.onmessage = (e) => {
      const { id, chunks } = e.data;
      const entry = pending.get(id);
      if (entry) {
        entry.resolve(chunks);
        pending.delete(id);
      }
    };
    chunkWorker.onerror = () => {
      chunkWorker?.terminate();
      chunkWorker = null;
      failPending("Chunk worker failed");
    };
  }

  if (!similarityWorker) {
    similarityWorker = new Worker(
      new URL("../../workers/similarity.ts", import.meta.url),
    );
    similarityWorker.onmessage = (e) => {
      const { id, results } = e.data;
      const entry = pending.get(id);
      if (entry) {
        entry.resolve(results);
        pending.delete(id);
      }
    };
    similarityWorker.onerror = () => {
      similarityWorker?.terminate();
      similarityWorker = null;
      failPending("Similarity worker failed");
    };
  }
}

export function chunkText(
  text: string,
  size?: number,
  overlap?: number,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!chunkWorker) initWorkers();
    if (!chunkWorker) {
      reject(new Error("Chunk worker unavailable"));
      return;
    }
    const id = msgId++;
    pending.set(id, { resolve, reject });
    chunkWorker.postMessage({ id, text, size, overlap });
  });
}

export function findSimilar(
  query: number[],
  items: Array<{ embedding: number[]; text: string; id?: string }>,
  k: number = 5,
): Promise<Array<{ text: string; score: number; id?: string }>> {
  return new Promise((resolve, reject) => {
    if (!similarityWorker) initWorkers();
    if (!similarityWorker) {
      reject(new Error("Similarity worker unavailable"));
      return;
    }
    const id = msgId++;
    pending.set(id, { resolve, reject });
    similarityWorker.postMessage({ id, query, items, k });
  });
}

export function terminate() {
  chunkWorker?.terminate();
  similarityWorker?.terminate();
  chunkWorker = null;
  similarityWorker = null;
  pending.clear();
}
