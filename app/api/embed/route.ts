import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/api/openai";
import { asString, readJsonBody } from "@/lib/api/request";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 120_000);
    const texts = body?.texts;

    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 25) {
      return NextResponse.json({ error: "Invalid texts" }, { status: 400 });
    }

    const normalized = texts.map((text) =>
      asString(text, 8_000, "text", { trim: false }),
    );

    const results = await embed(normalized);
    const embeddings = results.map(embedding => ({ embedding }));

    return NextResponse.json({ embeddings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to embed";
    const status = message.includes("Invalid") || message.includes("large") || message.includes("text")
      ? 400
      : 500;
    return NextResponse.json({ error: status === 400 ? message : "Failed to embed" }, { status });
  }
}
