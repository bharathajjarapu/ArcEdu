import { NextRequest } from "next/server";
import { generate } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  const { topic, num = 5, context } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  if (!context || context.trim().length === 0) {
    return Response.json({ error: "No context provided" }, { status: 400 });
  }

  const prompt = `Based on the following context, generate ${num} multiple choice questions about "${topic}".\n\nContext:\n${context}\n\nReturn ONLY a JSON array with format: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Brief explanation why this is correct"}]`;

  try {
    const response = await generate(
      prompt,
      "You are a quiz generator. Always respond with valid JSON only.",
    );

    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const quiz = JSON.parse(cleaned);

    return Response.json({ quiz });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
