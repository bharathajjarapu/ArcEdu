import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  const { topic, num = 10, context } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  if (!context || context.trim().length === 0) {
    return Response.json({ error: "No context provided" }, { status: 400 });
  }

  const prompt = `Based on the following context, generate ${num} flashcards about "${topic}".\n\nContext:\n${context}\n\nIMPORTANT: Generate each flashcard as a SEPARATE LINE of JSON. Each line should be valid JSON in this format:\n{"front": "...", "back": "..."}\n\nGenerate one flashcard per line, ${num} flashcards total.`;

  try {
    const response = await stream(
      prompt,
      "You are a flashcard generator. Return each flashcard as a separate line of valid JSON. One flashcard per line.",
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (!content) continue;

            buffer += content;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                const cleaned = trimmed.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                JSON.parse(cleaned); // Validate
                controller.enqueue(encoder.encode(cleaned + '\n'));
              } catch {
                // Skip invalid JSON
              }
            }
          }

          // Send remaining buffer
          if (buffer.trim()) {
            try {
              const cleaned = buffer.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
              JSON.parse(cleaned);
              controller.enqueue(encoder.encode(cleaned + '\n'));
            } catch {
              // Skip invalid JSON
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
