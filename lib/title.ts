const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "of",
  "the",
  "to",
  "in",
  "on",
  "at",
]);

const MAX_WORDS = 10;

function pickLongest(names: string[]): string {
  return names.reduce((longest, name) =>
    name.length > longest.length ? name : longest,
  names[0]);
}

function cleanName(raw: string): string {
  if (!raw) return "";

  let name = raw.split(/[\\/]/).pop() || raw;
  name = name.replace(/\.pdf$/i, "");

  try {
    name = decodeURIComponent(name);
  } catch {
    // ignore decode issues
  }

  name = name
    .replace(/[_\.]+/g, " ")
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  name = name
    .replace(/\b(v\d+|final|copy|draft)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = name.split(" ").filter(Boolean);

  while (parts.length && STOPWORDS.has(parts[0].toLowerCase())) parts.shift();
  while (parts.length && STOPWORDS.has(parts[parts.length - 1].toLowerCase())) parts.pop();

  const clipped = parts.slice(0, MAX_WORDS);
  const cased = clipped.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return cased.join(" ").trim();
}

export function makeTitleFromNames(names: string[]): string {
  if (!names || names.length === 0) return "New Session";
  const pdfs = names.filter((n) => n.toLowerCase().endsWith(".pdf"));
  const pick = pdfs.length > 0 ? pickLongest(pdfs) : names[0];
  return cleanName(pick) || "New Session";
}

export function makeTitleFromText(text: string): string {
  if (!text) return "New Session";
  const firstChunk = text.split(/[,|]/).map((t) => t.trim()).filter(Boolean)[0];
  return cleanName(firstChunk || text) || "New Session";
}

