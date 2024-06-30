import { NextRequest } from "next/server";
import { generate } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  const { topic, num = 10, context } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  if (!context || context.trim().length === 0) {
    return Response.json({ error: "No context provided" }, { status: 400 });
  }

  const prompt = `Based on the following context, generate ${num} flashcards about "${topic}".\n\nContext:\n${context}\n\nReturn ONLY a JSON array with format: [{"front": "...", "back": "..."}]`;

  try {
    const response = await generate(
      prompt,
      "You are a flashcard generator. Always respond with valid JSON only.",
    );

    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const flashcards = JSON.parse(cleaned);

    return Response.json({ flashcards });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
