import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map(d => d.embedding);
}

export async function generate(prompt: string, system?: string): Promise<string> {
  const messages: any[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages,
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}

export default client;
