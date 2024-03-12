export function chunk(text: string, maxTokens = 500): string[] {
  const lines = text.split('\n');
  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const isHeading = /^#{1,6}\s/.test(line) ||
                      /^[A-Z\s]{10,}$/.test(line) ||
                      /^\d+\./.test(line) ||
                      /^[•\-\*]\s/.test(line);

    if (isHeading && current.length > 100) {
      chunks.push(current.trim());
      current = line + '\n';
    } else if (line === '' && current.length > 300) {
      chunks.push(current.trim());
      current = '';
    } else {
      current += line + '\n';

      if (current.length > maxTokens * 4) {
        chunks.push(current.trim());
        current = '';
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter(c => c.length > 50);
}
