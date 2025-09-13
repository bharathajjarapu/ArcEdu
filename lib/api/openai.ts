import "server-only";
import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}


export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map(d => d.embedding);
}

export async function generate(prompt: string, system?: string): Promise<string> {
  const messages: any[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const response = await getClient().chat.completions.create({
    model: 'gpt-4.1-mini',
    messages,
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}

export async function stream(prompt: string, system?: string) {
  const messages: any[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const response = await getClient().chat.completions.create({
    model: 'gpt-4.1-nano',
    messages,
    temperature: 0.7,
    stream: true,
  });

  return response;
}

export default getClient;
