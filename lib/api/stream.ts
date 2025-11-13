const encoder = new TextEncoder();

export function createJsonStream(
    response: AsyncIterable<any>,
    extractContent: (chunk: any) => string
) {
    return new ReadableStream({
        async start(controller) {
            let buffer = '';
            let emitted = 0;

            try {
                for await (const chunk of response) {
                    const content = extractContent(chunk);
                    if (!content) continue;

                    buffer += content;

                    // Find complete JSON objects by tracking brace depth
                    let start = 0;
                    let depth = 0;
                    let inString = false;
                    let escape = false;

                    for (let i = 0; i < buffer.length; i++) {
                        const char = buffer[i];

                        if (escape) { escape = false; continue; }
                        if (char === '\\') { escape = true; continue; }
                        if (char === '"' && !escape) { inString = !inString; continue; }
                        if (inString) continue;

                        if (char === '{') {
                            if (depth === 0) start = i;
                            depth++;
                        }
                        if (char === '}') {
                            depth--;
                            if (depth === 0) {
                                const json = buffer.substring(start, i + 1);
                                try {
                                    JSON.parse(json);
                                    controller.enqueue(encoder.encode(json + '\n'));
                                    emitted++;
                                } catch {
                                    controller.error(new Error("Invalid quiz response"));
                                    return;
                                }
                                buffer = buffer.substring(i + 1);
                                i = -1; // Reset loop
                            }
                        }
                    }
                }

                // Process remaining
                if (buffer.trim()) {
                    try {
                        JSON.parse(buffer.trim());
                        controller.enqueue(encoder.encode(buffer.trim() + '\n'));
                        emitted++;
                    } catch {
                        controller.error(new Error("Invalid quiz response"));
                        return;
                    }
                }

                if (emitted === 0) {
                    controller.error(new Error("Empty quiz response"));
                    return;
                }

                controller.close();
            } catch (error) {
                controller.error(error);
            }
        }
    });
}

export const streamHeaders = {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
};
