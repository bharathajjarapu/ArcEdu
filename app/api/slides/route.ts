import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
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
  const { topic, context, numSlides = 10, slideDesign = "professional", codeEnabled, formulasEnabled, tablesEnabled, prompt } = await request.json();

  if (!topic || !context?.trim()) {
    return Response.json({ error: "Topic and context required" }, { status: 400 });
  }

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
2. Maximum 5 bullet points per slide
3. Each bullet should be ONE short line (under 15 words)
4. NO sub-bullets or nested lists
5. First slide = Title slide with topic name and 2-3 key points
6. Last slide = Summary/Conclusion with key takeaways

Style: ${slideDesign}
${designGuide}

${extras}
${prompt?.trim() ? `Focus on: ${prompt}` : ""}

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

  try {
    const response = await stream(slidesPrompt, "You are a presentation designer. Create slides with ONLY bullet points, no paragraphs. Each slide starts with --- then # Title then bullets. Keep bullets under 15 words each.");
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, { headers: streamHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
