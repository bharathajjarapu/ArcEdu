import { NextRequest } from "next/server";
import { streamMessages } from "@/lib/api/openai";
import { asString, readJsonBody } from "@/lib/api/request";
import { streamHeaders } from "@/lib/api/stream";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

function readHistory(value: unknown): HistoryMessage[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error("history must be an array");
  }

  return value.slice(-8).map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`history[${index}] is invalid`);
    }

    const role = (item as { role?: unknown }).role;
    if (role !== "user" && role !== "assistant") {
      throw new Error(`history[${index}].role is invalid`);
    }

    return {
      role,
      content: asString((item as { content?: unknown }).content, 4_000, `history[${index}].content`),
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 80_000);
    const message = asString(body?.message, 4_000, "message");
    const context = asString(body?.context, 24_000, "context");
    const scopeLabel = asString(body?.scopeLabel, 200, "scopeLabel", { optional: true });
    const history = readHistory(body?.history);

    const prompt = [
      scopeLabel ? `Scope: ${scopeLabel}` : "",
      `Question:\n${message}`,
      `Retrieved context:\n${context}`,
      "Answer using only the retrieved context.",
      "If the context is not enough, say that clearly.",
      "Be concise, accurate, and study-focused.",
      "Use short paragraphs or bullets when helpful.",
      "Do not invent sources or facts outside the provided context.",
    ].filter(Boolean).join("\n\n");

    const response = await streamMessages(
      [
        {
          role: "system",
          content: "You are ArcEdu's study chat assistant. Answer only from the provided retrieved context and keep the response clear and grounded.",
        },
        ...history,
        {
          role: "user",
          content: prompt,
        },
      ],
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
          if (!request.signal.aborted) controller.error(new Error("Failed to stream chat response"));
        }
      },
    });

    return new Response(readable, { headers: streamHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate chat answer";
    const status = message.includes("required") || message.includes("invalid") || message.includes("Invalid") || message.includes("must") || message.includes("large")
      ? 400
      : 500;
    return Response.json(
      { error: status === 400 ? message : "Failed to generate chat answer" },
      { status },
    );
  }
}
