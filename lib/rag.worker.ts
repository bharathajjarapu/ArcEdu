import * as db from "@/lib/db";
import type { Chunk, Doc } from "@/types";

// Pinned versions: jsDelivr npm files and Hugging Face commits never change.
const runtime = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const hub = "https://huggingface.co/MongoDB/mdbr-leaf-ir/resolve/4262131b32c3182bd06e67e92ae69d7bd66e0c5c/";
const prompt = "Represent this sentence for searching relevant passages: ";

interface Tensor {
  data: Float32Array;
  dims: number[];
}

interface Ort {
  env: { wasm: { wasmPaths: string } };
  Tensor: new (type: "int64", data: BigInt64Array, dims: number[]) => unknown;
  InferenceSession: {
    create: (model: Uint8Array, options: object) => Promise<{ run: (feeds: object) => Promise<Record<string, Tensor>> }>;
  };
}

interface Piece {
  doc: Doc;
  text: string;
  vector?: Float32Array;
}

// Fetches a file once and keeps it in the Cache API.
async function cached(url: string) {
  const cache = await caches.open("arcedu-models");
  const hit = await cache.match(url);
  if (hit) return hit;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${url}`);
  await cache.put(url, response.clone());
  return response;
}

let loading: Promise<{ ort: Ort; session: Awaited<ReturnType<Ort["InferenceSession"]["create"]>>; vocab: Map<string, number> }> | undefined;

// Loads onnxruntime-web, the int8 mdbr-leaf-ir model and its vocabulary once.
function model() {
  loading ??= (async () => {
    const ort: Ort = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${runtime}ort.wasm.min.mjs`);
    ort.env.wasm.wasmPaths = runtime;
    const [graph, weights, words] = await Promise.all(
      ["onnx/model_quantized.onnx", "onnx/model_quantized.onnx_data", "vocab.txt"].map((file) => cached(hub + file)),
    );
    const session = await ort.InferenceSession.create(new Uint8Array(await graph.arrayBuffer()), {
      externalData: [{ path: "model_quantized.onnx_data", data: new Uint8Array(await weights.arrayBuffer()) }],
    });
    const vocab = new Map((await words.text()).split(/\r?\n/).map((word, id) => [word, id]));
    return { ort, session, vocab };
  })();
  loading.catch(() => (loading = undefined));
  return loading;
}

// BERT uncased WordPiece: lowercase, strip accents, split words and punctuation, then longest-match pieces.
function tokenize(text: string, vocab: Map<string, number>, limit = 512) {
  const ids = [101];
  const words = text.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
  for (const word of words) {
    const pieces: number[] = [];
    for (let start = 0; start < word.length;) {
      let end = word.length;
      let id: number | undefined;
      while (end > start && (id = vocab.get((start ? "##" : "") + word.slice(start, end))) === undefined) end--;
      if (id === undefined) {
        pieces.splice(0, pieces.length, 100);
        break;
      }
      pieces.push(id);
      start = end;
    }
    ids.push(...pieces);
    if (ids.length >= limit - 1) break;
  }
  return [...ids.slice(0, limit - 1), 102];
}

// Embeds texts into unit vectors, batching similar lengths to cut padding.
async function embed(texts: string[]) {
  const { ort, session, vocab } = await model();
  const vectors: Float32Array[] = new Array(texts.length);
  const order = texts.map((_, index) => index).sort((a, b) => texts[a].length - texts[b].length);
  for (let from = 0; from < order.length; from += 16) {
    const batch = order.slice(from, from + 16);
    const rows = batch.map((index) => tokenize(texts[index], vocab));
    const width = Math.max(...rows.map((row) => row.length));
    const ids = new BigInt64Array(rows.length * width);
    const mask = new BigInt64Array(rows.length * width);
    rows.forEach((row, r) => row.forEach((id, c) => {
      ids[r * width + c] = BigInt(id);
      mask[r * width + c] = BigInt(1);
    }));
    const dims = [rows.length, width];
    const { sentence_embedding: output } = await session.run({
      input_ids: new ort.Tensor("int64", ids, dims),
      attention_mask: new ort.Tensor("int64", mask, dims),
      token_type_ids: new ort.Tensor("int64", new BigInt64Array(ids.length), dims),
    });
    const size = output.dims[1];
    batch.forEach((index, r) => {
      const vector = output.data.slice(r * size, (r + 1) * size);
      const norm = Math.hypot(...vector) || 1;
      vectors[index] = vector.map((value) => value / norm);
    });
  }
  return vectors;
}

// Splits text into ~1,200-character spans, ending at a paragraph or sentence break when one is near.
function split(text: string, size = 1200) {
  const spans: Chunk[] = [];
  for (let start = 0; start < text.length;) {
    let end = Math.min(text.length, start + size);
    if (end < text.length) {
      const paragraph = text.lastIndexOf("\n\n", end);
      const sentence = text.lastIndexOf(". ", end) + 1;
      end = paragraph > start + size / 2 ? paragraph : sentence > start + size / 2 ? sentence : end;
    }
    if (text.slice(start, end).trim()) spans.push({ start, end });
    start = end;
  }
  return spans;
}

// Chunks and embeds the session's documents that are not indexed yet.
async function index(sessionId: string) {
  for (const doc of await db.list<Doc>("documents", sessionId)) {
    if (doc.chunks?.every((chunk) => chunk.vector)) continue;
    const chunks = doc.chunks ?? split(doc.content);
    const vectors = await embed(chunks.map((chunk) => doc.content.slice(chunk.start, chunk.end))).catch(() => null);
    vectors?.forEach((vector, i) => (chunks[i].vector = vector));
    if (await db.get("documents", doc.id)) await db.put("documents", { ...doc, chunks });
    if (!vectors) return;
  }
}

// Words for keyword scoring.
const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

// BM25 keyword ranking of the pieces that contain any query word.
function bm25(query: string, pieces: Piece[]) {
  const terms = [...new Set(words(query))];
  const counts = pieces.map((piece) => {
    const count = new Map<string, number>();
    for (const word of words(piece.text)) count.set(word, (count.get(word) ?? 0) + 1);
    return count;
  });
  const lengths = counts.map((count) => [...count.values()].reduce((sum, n) => sum + n, 0));
  const average = lengths.reduce((sum, n) => sum + n, 0) / pieces.length;
  const idf = terms.map((term) => {
    const df = counts.filter((count) => count.has(term)).length;
    return Math.log(1 + (pieces.length - df + 0.5) / (df + 0.5));
  });
  const scores = counts.map((count, i) => terms.reduce((sum, term, t) => {
    const tf = count.get(term) ?? 0;
    return sum + (idf[t] * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * lengths[i]) / average));
  }, 0));
  return pieces.map((piece, i) => ({ piece, score: scores[i] })).filter((hit) => hit.score > 0);
}

// Fuses BM25 and dense rankings with reciprocal rank fusion.
async function rank(query: string, pieces: Piece[]) {
  const fused = new Map(pieces.map((piece) => [piece, 0]));
  const add = (hits: { piece: Piece; score: number }[]) =>
    hits.toSorted((a, b) => b.score - a.score).forEach((hit, rank) => fused.set(hit.piece, fused.get(hit.piece)! + 1 / (60 + rank)));

  add(bm25(query, pieces));
  const [vector] = await embed([prompt + query]).catch(() => []);
  if (vector) {
    add(pieces.flatMap((piece) => piece.vector ? [{ piece, score: piece.vector.reduce((sum, value, i) => sum + value * vector[i], 0) }] : []));
  }
  return pieces.toSorted((a, b) => fused.get(b)! - fused.get(a)!);
}

// Picks the best pieces for a query within a character budget and returns them in reading order.
async function search({ sessionId, query, budget }: { sessionId: string; query: string; budget: number }) {
  await index(sessionId);
  const docs = await db.list<Doc>("documents", sessionId);
  const pieces: Piece[] = docs.flatMap((doc) => (doc.chunks ?? split(doc.content)).map((chunk) => ({
    doc,
    text: doc.content.slice(chunk.start, chunk.end),
    vector: chunk.vector,
  })));
  const total = pieces.reduce((sum, piece) => sum + piece.text.length, 0);
  // Without a query, spread evenly over the material: every step-th piece first, then the gaps.
  const step = Math.max(1, Math.ceil(total / budget));
  const ranked = query ? await rank(query, pieces) : pieces.map((piece, i) => ({ piece, i })).toSorted((a, b) => (a.i % step) - (b.i % step)).map(({ piece }) => piece);

  // A focused query keeps only its top matches; otherwise fill the budget for coverage.
  const limit = query ? 12 : Infinity;
  const picked = new Set<Piece>();
  let used = 0;
  for (const piece of ranked) {
    if (picked.size === limit) break;
    if (used + piece.text.length > budget) continue;
    picked.add(piece);
    used += piece.text.length;
  }
  return docs
    .map((doc) => pieces.filter((piece) => piece.doc === doc && picked.has(piece)).map((piece) => piece.text))
    .flatMap((parts, i) => parts.length ? [`# ${docs[i].name}\n\n${parts.join("\n\n")}`] : [])
    .join("\n\n");
}

// One job at a time, so indexing never runs twice for the same documents.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = ({ data: { id, type, payload } }: MessageEvent) => {
  const job = (): Promise<unknown> => (type === "index" ? index(payload) : search(payload));
  queue = queue.then(job).then(
    (result) => self.postMessage({ id, result }),
    (error) => self.postMessage({ id, error: error instanceof Error ? error.message : String(error) }),
  );
};
