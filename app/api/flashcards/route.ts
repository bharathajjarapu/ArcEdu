import { NextRequest } from "next/server";
import { embed, generate } from "@/lib/api/openai";
import { topK } from "@/lib/utils/similarity";

export async function POST(request: NextRequest) {
  const { topic, num = 10, chunks, stream = false } = await request.json();

  if (!topic) {
    return Response.json({ error: "No topic provided" }, { status: 400 });
  }

  let context = "";

  if (chunks && chunks.length > 0) {
    console.log(`Processing ${chunks.length} chunks for topic: ${topic}`);
    const queryEmbedding = await embed(topic);
    const relevant = topK(queryEmbedding, chunks, 5);
    context = relevant.map((r) => r.text).join("\n\n");
    console.log(`Found context length: ${context.length}`);

    if (!context || context.trim().length === 0) {
      console.error("No relevant content found in chunks");
      return Response.json(
        {
          error:
            "No relevant content found in uploaded documents. Please upload documents with relevant content.",
        },
        { status: 400 },
      );
    }
  } else {
    console.error("No chunks provided to API");
    return Response.json(
      {
        error: "No document content available. Please upload documents first.",
      },
      { status: 400 },
    );
  }

  const prompt = `Based on the following context, generate ${num} flashcards about "${topic}".\n\nContext:\n${context}\n\nReturn ONLY a JSON array with format: [{"front": "...", "back": "..."}]`;

  if (stream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
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
          controller.enqueue(encoder.encode(JSON.stringify({ flashcards })));
          controller.close();
        } catch (error: any) {
          console.error("Flashcard generation error:", error);
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: error.message })),
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      },
    });
  }

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
    console.error("Flashcard generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
