import { formatFromPath, toMarkdownBytes } from "@firecrawl/anydoc";
import { llm } from "@/lib/llm";

const limit = 25 * 1024 * 1024;

// Transcribes a scanned PDF or an image to markdown with the vision LLM.
async function ocr(file: File, bytes: Uint8Array) {
  const data = `data:${file.type || "application/pdf"};base64,${Buffer.from(bytes).toString("base64")}`;
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
  if (!response?.ok) throw new Error("Could not read the scanned pages");
  return String((await response.json()).choices?.[0]?.message?.content ?? "");
}

// Converts one uploaded document to markdown with AnyDoc, falling back to LLM OCR for scans and images.
export async function POST(request: Request) {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > limit) return Response.json({ error: "File is over 25 MB" }, { status: 413 });

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const markdown = /\.(txt|md)$/i.test(file.name)
      ? new TextDecoder().decode(bytes)
      : file.type.startsWith("image/")
        ? await ocr(file, bytes)
        : await toMarkdownBytes(bytes, formatFromPath(file.name)).catch((error) => {
          if (error.code === "needsOcr" || /scanned/i.test(error.message)) return ocr(file, bytes);
          throw error;
        });
    if (!markdown.trim()) return Response.json({ error: "No text found" }, { status: 422 });
    return Response.json({ markdown });
  } catch (error) {
    return Response.json({ error: (error as Error).message || "Could not read this file" }, { status: 422 });
  }
}
