import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({ error: "Invalid texts" }, { status: 400 });
    }

    const results = await embed(texts);
    const embeddings = results.map(embedding => ({ embedding }));

    return NextResponse.json({ embeddings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
