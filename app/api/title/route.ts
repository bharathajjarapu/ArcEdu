import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/api/openai';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const prompt = `Generate a short, concise 2-4 word title for this content. Return ONLY the title, nothing else: ${content.substring(0, 500)}`;
    const title = await generate(prompt, 'You are a title generator. Return only the title.');

    return NextResponse.json({ title: title.trim().replace(/['"]/g, '') });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
