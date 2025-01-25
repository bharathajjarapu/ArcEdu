import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { createJsonStream, streamHeaders } from "@/lib/api/stream";

const difficultyInstructions = {
  easy: "Focus on basic recall, simple definitions, and straightforward facts. Questions should test fundamental understanding.",
  medium: "Include questions that require understanding and application of concepts. Mix of recall and comprehension.",
  hard: "Create challenging questions requiring analysis, evaluation, and synthesis. Include nuanced options and complex scenarios.",
  adaptive: "Create a mix of difficulty levels - start with easier questions and progress to harder ones. Include 2 easy, 2 medium, and the rest hard.",
};

export async function POST(request: NextRequest) {
  const { topic, num = 5, context, difficulty = "medium" } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  if (!context || context.trim().length === 0) {
    return Response.json({ error: "No context provided" }, { status: 400 });
  }

  const difficultyGuide = difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium;

  const prompt = `Based on the following context, generate ${num} multiple choice questions about "${topic}".

Difficulty: ${difficulty.toUpperCase()}
${difficultyGuide}

Context:
${context}

IMPORTANT: Return each question as a single line of valid JSON. Do not use markdown formatting.
Format: {"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..."}`;

  try {
    const response = await stream(
      prompt,
      "You are a quiz generator. Return one JSON object per line.",
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
