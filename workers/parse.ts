async function parsePDF(file: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(file);
  let text = "";

  const decoder = new TextDecoder("utf-8");
  const str = decoder.decode(data);

  const streamRegex = /stream\s+([\s\S]*?)\s+endstream/g;
  let match;

  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];
    const cleaned = streamContent.replace(/[^\x20-\x7E\n]/g, " ");
    text += cleaned + " ";
  }

  if (!text.trim()) {
    const textRegex = /\(([^)]+)\)/g;
    while ((match = textRegex.exec(str)) !== null) {
      text += match[1] + " ";
    }
  }

  return text.trim();
}

self.onmessage = async (e: MessageEvent) => {
  const { id, file } = e.data;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const text = await parsePDF(arrayBuffer);
    self.postMessage({ id, text, success: true });
  } catch (error: any) {
    self.postMessage({ id, error: error.message, success: false });
  }
};
