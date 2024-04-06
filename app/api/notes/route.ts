import { NextRequest, NextResponse } from 'next/server';
import { embed, generate } from '@/lib/api/openai';
import { topK } from '@/lib/utils/similarity';

export async function POST(request: NextRequest) {
  try {
    const { topic, chunks } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'No topic provided' }, { status: 400 });
    }

    let context = '';

    if (chunks && chunks.length > 0) {
      const queryEmbedding = await embed(topic);
      const relevant = topK(queryEmbedding, chunks, 8);
      context = relevant.map(r => r.text).join('\n\n');
    }

    const prompt = context
      ? `Based on the following context, generate comprehensive study notes about "${topic}".\n\nContext:\n${context}\n\nProvide clear, organized notes with key points and explanations.`
      : `Generate comprehensive study notes about "${topic}". Provide clear, organized notes with key points and explanations.`;

    const notes = await generate(prompt, 'You are a helpful study notes generator. Create clear, well-structured notes.');

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
