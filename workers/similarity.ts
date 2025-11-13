function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator > 0 ? dot / denominator : -1;
}

function topK(
  query: number[],
  items: Array<{ embedding: number[]; text: string; id?: string }>,
  k: number
): Array<{ text: string; score: number; id?: string }> {
  const best: Array<{ text: string; score: number; id?: string }> = [];

  for (const item of items) {
    const scored = {
      text: item.text,
      id: item.id,
      score: cosine(query, item.embedding),
    };

    let insertAt = best.findIndex((entry) => scored.score > entry.score);
    if (insertAt === -1) insertAt = best.length;

    if (insertAt < k) {
      best.splice(insertAt, 0, scored);
      if (best.length > k) best.pop();
    } else if (best.length < k) {
      best.push(scored);
    }
  }

  return best;
}

self.onmessage = (e: MessageEvent) => {
  const { id, query, items, k } = e.data;
  const results = topK(query, items, k);
  self.postMessage({ id, results });
};
