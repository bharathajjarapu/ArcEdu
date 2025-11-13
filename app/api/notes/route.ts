import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { asBoolean, asEnum, asString, readJsonBody } from "@/lib/api/request";
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

const NOTE_FORMATS = ["prompt", "summary", "structured", "exam", "cheatsheet"] as const;
const NOTE_LENGTHS = ["short", "medium", "long", "adaptive"] as const;

export async function POST(request: NextRequest) {
    try {
        const body = await readJsonBody(request, 80_000);
        const topic = asString(body?.topic, 200, "topic");
        const context = asString(body?.context, 20_000, "context");
        const notesFormat = asEnum(body?.notesFormat, NOTE_FORMATS, "structured", "notesFormat");
        const notesLength = asEnum(body?.notesLength, NOTE_LENGTHS, "medium", "notesLength");
        const prompt = asString(body?.prompt, 2_000, "prompt", { optional: true });
        const codeEnabled = asBoolean(body?.codeEnabled);
        const formulasEnabled = asBoolean(body?.formulasEnabled);
        const diagramsEnabled = asBoolean(body?.diagramsEnabled);
        const tablesEnabled = asBoolean(body?.tablesEnabled);

        const buildReadable = async (promptText: string) => {
            const response = await stream(
                promptText,
                "You are a study notes generator. Return clean markdown with properly formatted LaTeX math.",
                request.signal,
            );
            const encoder = new TextEncoder();
            return new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of response) {
                            if (request.signal.aborted) break;
                            const text = chunk.choices[0]?.delta?.content || "";
                            if (text) controller.enqueue(encoder.encode(text));
                        }
                        controller.close();
                    } catch {
                        if (!request.signal.aborted) controller.error(new Error("Failed to stream notes"));
                    }
                },
            });
        };

        if (!topic || !context) {
            return Response.json({ error: "Topic and context required" }, { status: 400 });
        }

        // Handle prompt-only mode - requires user's prompt, falls back to structured if empty
        if (notesFormat === "prompt") {
            if (!prompt) {
                const fallbackPrompt = `Create study notes about "${topic}" in structured format.
Use clear headings, bullet points, and organized sections.

Context:
${context}

Return well-formatted markdown notes.`;

                const readable = await buildReadable(fallbackPrompt);
                return new Response(readable, { headers: streamHeaders });
            }

            const promptOnlyNotes = `${prompt}

Context:
${context}

Return well-formatted markdown notes.`;

            const readable = await buildReadable(promptOnlyNotes);
            return new Response(readable, { headers: streamHeaders });
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
${prompt ? `\nFocus: ${prompt}` : ""}

Context:
${context}

Return well-formatted markdown notes.`;

        const readable = await buildReadable(notesPrompt);
        return new Response(readable, { headers: streamHeaders });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate notes";
        const status = message.includes("required") || message.includes("invalid") || message.includes("Invalid") || message.includes("must") || message.includes("large")
            ? 400
            : 500;
        return Response.json(
            { error: status === 400 ? message : "Failed to generate notes" },
            { status },
        );
    }
}
