import { llm } from "@/lib/llm";

// Guard on retrieved material size; the client already sends only its best ~40k characters.
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
  academic: "Educational tone with structured bullets and formulas where useful.",
  creative: "Bold, short impactful phrases and metaphors.",
  technical: "Technical bullets with short code snippets.",
  visual: "At most 3 very short bullets per slide.",
};

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
function prompts(body: Record<string, unknown>) {
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
      "You write presentation slides in markdown. Every slide starts with a line containing only --- and then a # title.",
      lines(
        `Write exactly ${count} slides using only the material below.`,
        "Use short one-line bullets (under 15 words), at most 5 per slide, no paragraphs, no nested lists, no emojis. The first slide introduces the topic and the last one sums up the key takeaways.",
        pick(designs, body.design, "professional"),
        ...chosen.filter((line) => line !== extras.diagrams),
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

// Streams generated text from the configured LLM.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!["quiz", "notes", "slides"].includes(body?.kind)) return Response.json({ error: "Unknown format" }, { status: 400 });
  if (typeof body.context !== "string" || !body.context.trim()) return Response.json({ error: "Upload documents first" }, { status: 400 });

  const [system, prompt] = prompts(body);
  const response = await llm(
    [{ role: "system", content: system }, { role: "user", content: prompt }],
    { stream: true, signal: request.signal },
  );
  if (!response?.ok || !response.body) return Response.json({ error: "The AI service is unavailable" }, { status: 502 });

  // Turns server-sent events into plain text deltas.
  let buffer = "";
  const text = new TransformStream<string, string>({
    transform(chunk, controller) {
      const events = (buffer + chunk).split("\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const data = event.replace(/^data:\s*/, "").trim();
        if (!event.startsWith("data:") || data === "[DONE]") continue;
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) controller.enqueue(delta);
      }
    },
  });

  return new Response(response.body.pipeThrough(new TextDecoderStream()).pipeThrough(text).pipeThrough(new TextEncoderStream()), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
