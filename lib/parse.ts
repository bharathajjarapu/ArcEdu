import * as fflate from "fflate";

export async function parse(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (ext === "pdf") return parsePDF(buffer);
  if (ext === "docx") return parseDOCX(buffer);
  if (ext === "pptx") return parsePPTX(buffer);
  if (ext === "txt") return await file.text();

  return "";
}

async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await loadPdfjs();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((item: any) => item.str).join(" "));
  }

  return texts.join("\n");
}

let pdfjsPromise: Promise<any> | null = null;

function loadPdfjs(): Promise<any> {
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise((resolve, reject) => {
    const loader = document.createElement("script");
    loader.type = "module";
    loader.textContent = `
      import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs";
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs";
      window.pdfjsLib = pdfjsLib;
      window.dispatchEvent(new Event("pdfjs-ready"));
    `;
    window.addEventListener("pdfjs-ready", () => {
      const lib = (window as any).pdfjsLib;
      if (lib) resolve(lib);
      else reject(new Error("pdfjsLib not found"));
    }, { once: true });
    loader.onerror = () => { pdfjsPromise = null; reject(new Error("Failed to load pdf.js")); };
    document.head.appendChild(loader);
  });
  return pdfjsPromise;
}

async function parseDOCX(buffer: ArrayBuffer): Promise<string> {
  const files = fflate.unzipSync(new Uint8Array(buffer));
  const xml = new TextDecoder().decode(files["word/document.xml"]);
  return extractText(xml, /<w:t[^>]*>([^<]*)<\/w:t>/g);
}

async function parsePPTX(buffer: ArrayBuffer): Promise<string> {
  const files = fflate.unzipSync(new Uint8Array(buffer));
  const texts: string[] = [];

  for (const name of Object.keys(files)) {
    if (name.startsWith("ppt/slides/slide") && name.endsWith(".xml")) {
      const xml = new TextDecoder().decode(files[name]);
      texts.push(extractText(xml, /<a:t>([^<]*)<\/a:t>/g));
    }
  }

  return texts.join("\n");
}

function extractText(xml: string, regex: RegExp): string {
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) matches.push(match[1]);
  }
  return matches.join(" ");
}

