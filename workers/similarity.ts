function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function topK(
  query: number[],
  items: Array<{ embedding: number[]; text: string; id?: string }>,
  k: number
): Array<{ text: string; score: number; id?: string }> {
  const scored = items.map((item) => ({
    text: item.text,
    id: item.id,
    score: cosine(query, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

self.onmessage = (e: MessageEvent) => {
  const { id, query, items, k } = e.data;
  const results = topK(query, items, k);
  self.postMessage({ id, results });
};
