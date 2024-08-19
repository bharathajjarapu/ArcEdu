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
            if (line.trim() && items.length < maxItems) {
                try {
                    const item = JSON.parse(line);
                    items.push(item);
                    if (onProgress) onProgress(item);
                } catch (e) {
                    console.warn('Failed to parse line:', line);
                }
            }
        }
    }

    return items;
}
