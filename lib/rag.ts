let worker: Worker | undefined;
let next = 0;
const waiting = new Map<number, { resolve: (value: never) => void; reject: (error: Error) => void }>();

// Sends a job to the RAG worker, starting it on first use.
function call<T>(type: "index" | "search", payload: unknown) {
  worker ??= Object.assign(new Worker(new URL("./rag.worker.ts", import.meta.url), { type: "module" }), {
    onmessage: ({ data }: MessageEvent) => {
      const job = waiting.get(data.id);
      waiting.delete(data.id);
      if (data.error) job?.reject(new Error(data.error));
      else job?.resolve(data.result as never);
    },
  });
  const id = next++;
  return new Promise<T>((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    worker!.postMessage({ id, type, payload });
  });
}

// Chunks and embeds a session's new documents in the background.
export const index = (sessionId: string) => call<void>("index", sessionId);

// Hybrid BM25 + dense retrieval of the session's most relevant markdown, within a character budget.
export const search = (sessionId: string, query: string, budget: number) => call<string>("search", { sessionId, query, budget });
