import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { createJsonStream, streamHeaders } from "@/lib/api/stream";

export async function POST(request: NextRequest) {
  const { topic, num = 10, context } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  if (!context || context.trim().length === 0) {
    return Response.json({ error: "No context provided" }, { status: 400 });
  }

  const prompt = `Based on the following context, generate ${num} flashcards about "${topic}".
Context:
${context}

IMPORTANT: Return each flashcard as a single line of valid JSON. Do not use markdown formatting.
Format: {"front": "...", "back": "..."}`;

  try {
    const response = await stream(
      prompt,
      "You are a flashcard generator. Return one JSON object per line.",
    );

    const readable = createJsonStream(
      response,
      (chunk) => chunk.choices[0]?.delta?.content || ''
    );

    return new Response(readable, { headers: streamHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
