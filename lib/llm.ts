// Calls the OpenAI-compatible chat completions API configured by LLM_BASE_URL, LLM_KEY and LLM_MODEL.
export function llm(messages: object[], options: { stream?: boolean; signal?: AbortSignal } = {}) {
  return fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LLM_KEY}` },
    body: JSON.stringify({ model: process.env.LLM_MODEL, stream: options.stream, messages }),
    signal: options.signal,
  }).catch(() => null);
}
