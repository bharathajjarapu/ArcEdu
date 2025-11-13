export async function parseStream<T>(
    response: Response,
    maxItems: number,
    onProgress?: (item: T) => void
): Promise<T[]> {
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const items: T[] = [];
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Cleanup potential markdown or trailing commas if model messes up
            const cleaned = trimmed
                .replace(/^```json/, '')
                .replace(/^```/, '')
                .replace(/,$/, '');

            if (cleaned && items.length < maxItems) {
                try {
                    const item = JSON.parse(cleaned);
                    items.push(item);
                    if (onProgress) onProgress(item);
                } catch (e) {
                    // console.warn('Failed to parse line:', line);
                }
            }
        }
    }

    // Process remaining buffer
    if (buffer.trim() && items.length < maxItems) {
        try {
            const cleaned = buffer.trim()
                .replace(/^```json/, '')
                .replace(/^```/, '')
                .replace(/,$/, '');
            const item = JSON.parse(cleaned);
            items.push(item);
            if (onProgress) onProgress(item);
        } catch (e) { }
    }

    return items;
}
