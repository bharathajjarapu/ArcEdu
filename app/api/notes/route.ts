import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  try {
    const { topic, context } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "No topic provided" }, { status: 400 });
    }

    const prompt = context
      ? `Based on the following context, generate comprehensive study notes about "${topic}".\n\nContext:\n${context}\n\nProvide clear, organized notes with key points and explanations.`
      : `Generate comprehensive study notes about "${topic}". Provide clear, organized notes with key points and explanations.`;

    const notes = await generate(
      prompt,
      "You are a helpful study notes generator. Create clear, well-structured notes.",
    );

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
