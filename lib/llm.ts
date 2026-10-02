export interface Config {
  url: string;
  model: string;
  key: string;
}

// Reads the API settings saved in this browser.
export function config(): Config {
  try {
    return { url: "", model: "", key: "", ...JSON.parse(localStorage.llm ?? "{}") };
  } catch {
    return { url: "", model: "", key: "" };
  }
}

// Calls the user's OpenAI-compatible chat completions API straight from the browser, so the key never reaches our server.
export async function llm(messages: object[], options: { stream?: boolean; signal?: AbortSignal } = {}) {
  const { url, model, key } = config();
  if (!url || !model) throw new Error("Add your API settings in Settings first");
  const response = await fetch(`${url.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key && { Authorization: `Bearer ${key}` }) },
    body: JSON.stringify({ model, stream: options.stream, messages }),
    signal: options.signal,
  }).catch((error) => {
    if (options.signal?.aborted) throw error;
    return null;
  });
  if (!response?.ok) throw new Error((await response?.json().catch(() => null))?.error?.message ?? "The AI service is unavailable");
  return response;
}

// Transcribes a scanned PDF or an image to markdown with the vision model.
export async function ocr(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^;]*/, `data:${file.type || "application/pdf"}`));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const part = file.type.startsWith("image/")
    ? { type: "image_url", image_url: { url: data } }
    : { type: "file", file: { filename: file.name, file_data: data } };
  const response = await llm([{
    role: "user",
    content: [
      { type: "text", text: "Transcribe all text in this document to clean GitHub-flavored markdown. Keep headings, lists and tables; write math as LaTeX. Output only the markdown." },
      part,
    ],
  }]);
  return String((await response.json()).choices?.[0]?.message?.content ?? "");
}
