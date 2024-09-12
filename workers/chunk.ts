function chunkText(text: string, size: number = 1500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > size && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(" ");
      current = words.slice(-Math.floor(overlap / 5)).join(" ") + " " + sentence;
    } else {
      current += " " + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter(c => c.length > 0);
}

self.onmessage = (e: MessageEvent) => {
  const { id, text, size, overlap } = e.data;
  const chunks = chunkText(text, size, overlap);
  self.postMessage({ id, chunks });
};
