import { NextRequest } from "next/server";
import { stream } from "@/lib/api/openai";
import { asEnum, asNumber, asString, readJsonBody } from "@/lib/api/request";
import { createJsonStream, streamHeaders } from "@/lib/api/stream";

const difficultyInstructions = {
  easy: "Focus on basic recall, simple definitions, and straightforward facts. Questions should test fundamental understanding.",
  medium: "Include questions that require understanding and application of concepts. Mix of recall and comprehension.",
  hard: "Create challenging questions requiring analysis, evaluation, and synthesis. Include nuanced options and complex scenarios.",
  adaptive: "Create a mix of difficulty levels - start with easier questions and progress to harder ones. Include 2 easy, 2 medium, and the rest hard.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 80_000);
    const topic = asString(body?.topic, 200, "topic");
    const context = asString(body?.context, 20_000, "context");
    const num = asNumber(body?.num, "num", { fallback: 5, min: 1, max: 30 });
    const difficulty = asEnum(
      body?.difficulty,
      ["easy", "medium", "hard", "adaptive"] as const,
      "medium",
      "difficulty",
    );
    const prompt = asString(body?.prompt, 2_000, "prompt", { optional: true });
    const timeLimit = asNumber(body?.timeLimit, "timeLimit", { fallback: 0, min: 0, max: 120 });

    const difficultyGuide = difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium;

    const focusInstruction = prompt
      ? `\n\nFOCUS: ${prompt}\nGenerate questions that specifically address these topics/concepts.`
      : '';

    const timeLimitInstruction = timeLimit
      ? `\n\nTIME CONSTRAINT: ${timeLimit} minutes total for ${num} questions (approx ${Math.max(1, Math.floor(timeLimit / num))} min per question). Adjust question complexity accordingly.`
      : '';

    const questionPrompt = `Based on the following context, generate ${num} multiple choice questions about "${topic}".

Difficulty: ${difficulty.toUpperCase()}
${difficultyGuide}${focusInstruction}${timeLimitInstruction}

Context:
${context}

IMPORTANT: Return each question as a single line of valid JSON. Do not use markdown formatting.
Format: {"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..."}`;

    const response = await stream(
      questionPrompt,
      "You are a quiz generator. Return one JSON object per line.",
      request.signal,
    );

    const readable = createJsonStream(
      response,
      (chunk) => chunk.choices[0]?.delta?.content || ''
    );

    return new Response(readable, { headers: streamHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate quiz";
    const status = message.includes("required") || message.includes("invalid") || message.includes("Invalid") || message.includes("must") || message.includes("large")
      ? 400
      : 500;
    return Response.json({ error: status === 400 ? message : "Failed to generate quiz" }, { status });
  }
}
