// Guard on retrieved material size; retrieval already picks only its best ~40k characters.
const limit = 60_000;

const levels: Record<string, string> = {
  easy: "Test basic recall, simple definitions and straightforward facts.",
  medium: "Mix recall with understanding and applying concepts.",
  hard: "Require analysis and synthesis, with nuanced options and scenarios.",
  adaptive: "Start easy and get harder, ending on the hardest questions.",
};

const styles: Record<string, string> = {
  summary: "Write a concise summary with key takeaways.",
  structured: "Use clear headings, bullet points and organized sections.",
  exam: "Focus on testable concepts with definitions and examples.",
  cheatsheet: "Write a quick reference of formulas, key terms and shortcuts.",
  prompt: "Follow the focus instructions exactly.",
};

const lengths: Record<string, string> = {
  short: "Keep it brief, key points only.",
  medium: "Give balanced coverage with moderate detail.",
  long: "Be comprehensive, with thorough explanations and examples.",
  adaptive: "Match the length to the topic's complexity.",
};

const designs: Record<string, string> = {
  professional: "Formal tone, concise bullets.",
  academic: "Educational tone that defines key terms, with formulas in plain text where useful.",
  creative: "Bold, short impactful phrases and metaphors.",
  technical: "Precise technical language with concrete specifics.",
  visual: "Prefer stats, steps, columns and quote slides, with at most 3 bullets per slide.",
};

// Slide layouts the deck builder draws, with their limits so text always fits.
const layouts = [
  '{"layout": "title", "title": "...", "subtitle": "..."} opening slide only',
  '{"layout": "bullets", "title": "...", "bullets": ["...", "..."]} 3 to 5 bullets',
  '{"layout": "columns", "title": "...", "columns": [{"heading": "...", "bullets": ["...", "..."]}]} 2 or 3 columns of 2 or 3 bullets under 8 words, to compare things',
  '{"layout": "stats", "title": "...", "stats": [{"value": "...", "label": "..."}]} 2 to 4 numbers from the material, values at most 6 characters',
  '{"layout": "steps", "title": "...", "steps": ["...", "..."]} 3 to 5 stages of a process, each at most 4 words',
  '{"layout": "table", "title": "...", "rows": [["...", "..."], ["...", "..."]]} first row is the header, up to 4 columns and 6 rows, cells under 5 words',
  '{"layout": "quote", "quote": "...", "author": "..."} a key definition or idea under 25 words',
].join("\n");

const extras: Record<string, string> = {
  code: "Include code examples where relevant.",
  formulas: "Write all math in LaTeX with $inline$ and $$display$$ delimiters, always closed.",
  diagrams: "Add small top-down mermaid diagrams (```mermaid, graph TD) with simple ids and quoted labels like A[\"Label\"].",
  tables: "Use markdown tables for comparisons.",
};

// Returns the value for a known key, else the fallback key's value.
const pick = (map: Record<string, string>, key: unknown, fallback: string) =>
  map[Object.hasOwn(map, String(key)) ? String(key) : fallback];

// Clamps a number option into range.
const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || fallback)));

// Builds the system and user prompts for a generation request.
export function prompts(body: Record<string, unknown>) {
  const focus = String(body.prompt ?? "").slice(0, 2_000).trim();
  const material = `Study material:\n${String(body.context).slice(0, limit)}`;
  const chosen = Array.isArray(body.extras) ? body.extras.map((key) => pick(extras, key, "")).filter(Boolean) : [];
  const lines = (...parts: (string | false)[]) => parts.filter(Boolean).join("\n\n");

  if (body.kind === "quiz") {
    const count = clamp(body.questions, 1, 30, 5);
    const minutes = clamp(body.minutes, 0, 120, 0);
    return [
      "You write multiple choice quizzes from study material. Output one JSON object per line and nothing else: no markdown, no numbering.",
      lines(
        `Write ${count} questions using only the material below.`,
        pick(levels, body.difficulty, "medium"),
        "Spread the correct answer across all option positions.",
        minutes > 0 && `Students get ${minutes} minutes for all questions, so size them to fit.`,
        focus && `Focus on: ${focus}`,
        'Each line: {"question": "...", "options": ["...", "...", "...", "..."], "answer": <index of the correct option>, "explanation": "..."}',
        material,
      ),
    ];
  }

  if (body.kind === "slides") {
    const count = clamp(body.slides, 1, 50, 10);
    return [
      "You design presentation slides from study material. Output one JSON object per line, one slide per line, and nothing else: no markdown, no code fences, no numbering.",
      lines(
        `Write exactly ${count} slides using only the material below. Pick a layout for each slide:\n${layouts}`,
        "Start with a title slide and end with a bullets slide of key takeaways. Vary the layouts: never more than two bullets slides in a row, and use columns, stats, steps or table wherever the material compares, counts or sequences things. Never invent numbers.",
        "Titles under 8 words. Bullets under 12 words with no full stops. No markdown, emojis or LaTeX: write math in plain text with Unicode symbols like x², √ and π.",
        body.speaker === true && 'Add "notes" to every slide: 2 or 3 sentences the presenter can say.',
        pick(designs, body.design, "professional"),
        focus && `Focus on: ${focus}`,
        material,
      ),
    ];
  }

  return [
    "You write clear study notes in GitHub-flavored markdown, starting with a # title.",
    lines(
      "Write study notes using only the material below.",
      pick(styles, body.style === "prompt" && !focus ? "structured" : body.style, "structured"),
      pick(lengths, body.length, "medium"),
      ...chosen,
      focus && `Focus on: ${focus}`,
      material,
    ),
  ];
}
