import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { streamHeaders } from "@/lib/api/stream";

const formatInstructions: Record<string, string> = {
    summary: "Create a concise summary with key takeaways.",
    structured: "Use clear headings, bullet points, and organized sections.",
    exam: "Focus on testable concepts with definitions and examples.",
    cheatsheet: "Create a quick reference with formulas, key terms, and shortcuts.",
};

const MATH_INSTRUCTIONS = `
IMPORTANT - Math formatting rules:
- Wrap ALL math expressions in dollar signs: $expression$ for inline, $$expression$$ for display
- Use proper LaTeX: $x^2$ not x^2, $\\alpha$ not alpha, $x_n$ for subscripts
- For primes use \\prime: $x^\\prime$ or $x'$ 
- Fractions: $\\frac{a}{b}$, summations: $\\sum_{i=1}^{n}$
- Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\theta$, $\\Theta$
- Every formula must have matching $ delimiters - never leave unclosed
- In tables, each cell formula must be complete: | $E = mc^2$ |
`;

export async function POST(request: NextRequest) {
    const { topic, context, notesFormat = "structured", codeEnabled, formulasEnabled, diagramsEnabled, tablesEnabled, prompt } = await request.json();

    if (!topic || !context?.trim()) {
        return Response.json({ error: "Topic and context required" }, { status: 400 });
    }

    const formatGuide = formatInstructions[notesFormat] || formatInstructions.structured;
    const extras = [
        codeEnabled && "Include code examples where relevant.",
        formulasEnabled && MATH_INSTRUCTIONS,
        diagramsEnabled && "Include ASCII diagrams where helpful.",
        tablesEnabled && "Use markdown tables for comparisons.",
    ].filter(Boolean).join(" ");

    const notesPrompt = `Create study notes about "${topic}" in ${notesFormat} format.

${formatGuide}
${extras}
${prompt?.trim() ? `\nFocus: ${prompt}` : ""}

Context:
${context}

Return well-formatted markdown notes.`;

    try {
        const response = await stream(notesPrompt, "You are a study notes generator. Return clean markdown with properly formatted LaTeX math.");
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
