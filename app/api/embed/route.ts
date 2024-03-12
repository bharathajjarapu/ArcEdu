import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/api/openai";
import { group } from "@/lib/process/batch";

const batchSize = 20;

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({ error: "Invalid texts" }, { status: 400 });
    }

    const batches = group(texts, batchSize);
    const allEmbeddings = [];

    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map(async (text) => ({
          embedding: await embed(text),
        })),
      );
      allEmbeddings.push(...embeddings);
    }

    return NextResponse.json({ embeddings: allEmbeddings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
