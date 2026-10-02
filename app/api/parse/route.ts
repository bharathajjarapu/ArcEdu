import { formatFromPath, toMarkdownBytes } from "@firecrawl/anydoc";

const limit = 25 * 1024 * 1024;

// Converts one uploaded document to markdown with AnyDoc; scans come back flagged for OCR in the browser.
export async function POST(request: Request) {
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > limit) return Response.json({ error: "File is over 25 MB" }, { status: 413 });

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const markdown = /\.(txt|md)$/i.test(file.name) ? new TextDecoder().decode(bytes) : await toMarkdownBytes(bytes, formatFromPath(file.name));
    if (!markdown.trim()) return Response.json({ error: "No text found" }, { status: 422 });
    return Response.json({ markdown });
  } catch (error) {
    if ((error as { code?: string }).code === "needsOcr" || /scanned/i.test((error as Error).message)) return Response.json({ ocr: true });
    return Response.json({ error: (error as Error).message || "Could not read this file" }, { status: 422 });
  }
}
