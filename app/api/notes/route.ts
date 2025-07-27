import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { streamHeaders } from "@/lib/api/stream";

const formatInstructions: Record<string, string> = {
    prompt: "", // Empty - uses user's prompt only
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

const DIAGRAM_INSTRUCTIONS =
    "Diagram rules:\\n" +
    "- Use ```mermaid ...``` fences\\n" +
    "- Keep small (few nodes/edges), top-down: graph TD\\n" +
    "- IDs simple (A,B,Node1); labels in quotes e.g., A[\\\"Label\\\"]\\n" +
    "- No braces/math in IDs; keep math as text\\n" +
    "- No extra styling/HTML";

const lengthInstructions: Record<string, string> = {
    short: "Keep notes brief and concise, focusing only on key points.",
    medium: "Provide balanced coverage with moderate detail.",
    long: "Create comprehensive notes with thorough explanations and examples.",
    adaptive: "Adjust length based on topic complexity.",
};

export async function POST(request: NextRequest) {
    const { topic, context, notesFormat = "structured", notesLength = "medium", codeEnabled, formulasEnabled, diagramsEnabled, tablesEnabled, prompt } = await request.json();

    if (!topic || !context?.trim()) {
        return Response.json({ error: "Topic and context required" }, { status: 400 });
    }

    // Handle prompt-only mode - requires user's prompt, falls back to structured if empty
    if (notesFormat === "prompt") {
        if (!prompt?.trim()) {
            // Fall back to structured format if no prompt provided
            const fallbackPrompt = `Create study notes about "${topic}" in structured format.
Use clear headings, bullet points, and organized sections.

Context:
${context}

Return well-formatted markdown notes.`;
            try {
                const response = await stream(fallbackPrompt, "You are a study notes generator. Return clean markdown with properly formatted LaTeX math.");
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
        const promptOnlyNotes = `${prompt.trim()}

Context:
${context}

Return well-formatted markdown notes.`;

        try {
            const response = await stream(promptOnlyNotes, "You are a study notes generator. Return clean markdown with properly formatted LaTeX math.");
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

    const formatGuide = formatInstructions[notesFormat] || formatInstructions.structured;
    const extras = [
        codeEnabled === true && "Include code examples where relevant.",
        codeEnabled === false && "Avoid code blocks unless essential.",
        formulasEnabled === true && MATH_INSTRUCTIONS,
        formulasEnabled === false && "Avoid math formulas unless essential.",
        diagramsEnabled === true && `${DIAGRAM_INSTRUCTIONS} Include simple mermaid diagrams (\`\`\`mermaid) with few nodes for clarity.`,
        diagramsEnabled === false && "Avoid diagrams unless essential.",
        tablesEnabled === true && "Use markdown tables for comparisons.",
        tablesEnabled === false && "Avoid tables unless essential.",
    ].filter(Boolean).join(" ");

    const lengthGuide = lengthInstructions[notesLength] || lengthInstructions.medium;
    const notesPrompt = `Create study notes about "${topic}" in ${notesFormat} format.

${formatGuide}
${lengthGuide}
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
