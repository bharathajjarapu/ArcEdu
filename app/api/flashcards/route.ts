import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { createJsonStream, streamHeaders } from "@/lib/api/stream";

const difficultyInstructions = {
  easy: "Focus on basic terms and simple definitions. Keep answers short and direct.",
  medium: "Include concept explanations and applications. Answers can be more detailed.",
  hard: "Cover complex relationships, nuances, and deeper understanding. Include edge cases and exceptions.",
  adaptive: "Mix difficulty levels - start with basic terms, then concepts, then complex ideas.",
};

export async function POST(request: NextRequest) {
  const { topic, num = 10, context, difficulty = "medium", prompt } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  if (!context || context.trim().length === 0) {
    return Response.json({ error: "No context provided" }, { status: 400 });
  }

  const difficultyGuide = difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium;

  const focusInstruction = prompt?.trim()
    ? `\n\nFOCUS: ${prompt}\nCreate flashcards that specifically address these topics/concepts.`
    : '';

  const flashcardPrompt = `Based on the following context, generate ${num} flashcards about "${topic}".

Difficulty: ${difficulty.toUpperCase()}
${difficultyGuide}${focusInstruction}

Context:
${context}

IMPORTANT: Return each flashcard as a single line of valid JSON. Do not use markdown formatting.
Format: {"front": "...", "back": "..."}`;

  try {
    const response = await stream(
      flashcardPrompt,
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
