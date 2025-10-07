import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { asBoolean, asEnum, asNumber, asString, readJsonBody } from "@/lib/api/request";
import { streamHeaders } from "@/lib/api/stream";

const designStyles: Record<string, string> = {
  minimal: "Clean, minimal design. Short bullet points only. Maximum 4 bullets per slide. No paragraphs.",
  professional: "Corporate professional style. Concise bullets. Maximum 5 bullets per slide. Formal tone.",
  colorful: "Vibrant and engaging. Use 1-2 emojis per slide. Short punchy bullets. Maximum 4 bullets.",
  academic: "Educational and formal. Include LaTeX formulas. Structured bullets. Maximum 5 bullets per slide.",
  creative: "Bold and artistic. Short impactful phrases. Maximum 4 bullets. Use metaphors.",
  dark: "Optimized for dark mode. Ultra-concise bullets. Maximum 4 per slide.",
  technical: "Code-focused. Include code snippets. Technical bullets. Maximum 5 per slide.",
  visual: "Minimal text. Maximum 3 short bullets per slide. Suggest [Image: description] placeholders.",
};

const MATH_INSTRUCTIONS = `
Math formatting:
- Inline math: $expression$
- Display math: $$expression$$
- Use LaTeX: $x^2$, $\\frac{a}{b}$, $\\sum_{i=1}^{n}$, $\\alpha$, $\\beta$
`;

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 80_000);
    const topic = asString(body?.topic, 200, "topic");
    const context = asString(body?.context, 20_000, "context");
    const numSlides = asNumber(body?.numSlides, "numSlides", { fallback: 10, min: 1, max: 50 });
    const slideDesign = asEnum(
      body?.slideDesign,
      ["minimal", "professional", "colorful", "academic", "creative", "dark", "technical", "visual"] as const,
      "professional",
      "slideDesign",
    );
    const prompt = asString(body?.prompt, 2_000, "prompt", { optional: true });
    const codeEnabled = asBoolean(body?.codeEnabled);
    const formulasEnabled = asBoolean(body?.formulasEnabled);
    const tablesEnabled = asBoolean(body?.tablesEnabled);

    const designGuide = designStyles[slideDesign] || designStyles.professional;

    const extras = [
      codeEnabled === true && "Include short code snippets where relevant.",
      formulasEnabled === true && MATH_INSTRUCTIONS,
      tablesEnabled === true && "Use simple markdown tables when comparing items.",
    ].filter(Boolean).join("\n");

    const slidesPrompt = `Create exactly ${numSlides} presentation slides about "${topic}".

CRITICAL FORMAT RULES:
1. Each slide MUST start with "---" on its own line
2. Immediately after ---, put the slide title as "# Title"

SLIDE FORMAT RULES
1. Use ONLY bullet points (- item), NO paragraphs
2. Maximum 5 bullet points per slide, If needed use small sentences
3. Use Bold, Italic, Headings, Blockquotes When Needed
4. Use Code Blocks for Code Snippets and Information Snippets
5. Use Latex for formulas and equations
6. Use tables for comparisons, timelines, and data
7. No sub-bullets or nested lists or emojis or emoticons
8. Each bullet should be ONE short line (under 15 words) 
9. First slide = Title slide with topic name and 2-3 key points
10. Last slide = Summary/Conclusion with key takeaways 

Style: ${slideDesign}
${designGuide}

${extras}
${prompt ? `Focus on: ${prompt}` : ""}

Reference content:
${context}

Example format:
---
# Slide Title Here

- First key point in one short line
- Second important concept briefly
- Third bullet with essential info
- Fourth point if needed

---
# Next Slide Title

- Another concise bullet point
- Keep it short and clear

Generate ${numSlides} slides now:`;

    const response = await stream(
      slidesPrompt,
      "You are a presentation designer. Create slides with ONLY bullet points, no paragraphs. Each slide starts with --- then # Title then bullets. Keep bullets under 15 words each.",
      request.signal,
    );
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (request.signal.aborted) break;
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch {
          if (!request.signal.aborted) controller.error(new Error("Failed to stream slides"));
        }
      },
    });

    return new Response(readable, { headers: streamHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate slides";
    const status = message.includes("required") || message.includes("invalid") || message.includes("Invalid") || message.includes("must") || message.includes("large")
      ? 400
      : 500;
    return Response.json({ error: status === 400 ? message : "Failed to generate slides" }, { status });
  }
}
