import { useCallback } from "react";
import type { Quiz, Chunk, Difficulty, NotesFormat } from "@/types";
import * as sessions from "@/lib/storage/sessions";
import * as docs from "@/lib/storage/docs";
import { simple as simpleHash } from "@/lib/data/hash";
import { group } from "@/lib/process/batch";
import { embedBatch, generateQuiz, generateNotes, generateSlides } from "@/lib/api/client";

interface GenerateOptions {
  sessionId: string;
  topic: string;
  numQuestions: number;
  difficulty?: Difficulty;
  prompt?: string;
  timeLimit?: number;
  onProgress?: (item: Quiz) => void;
}

interface NotesOptions {
  sessionId: string;
  topic: string;
  notesFormat: NotesFormat;
  notesLength: string;
  codeEnabled: boolean;
  formulasEnabled: boolean;
  diagramsEnabled: boolean;
  tablesEnabled: boolean;
  prompt?: string;
  onProgress?: (text: string) => void;
}

interface SlidesOptions {
  sessionId: string;
  topic: string;
  numSlides: number;
  slideDesign: string;
  codeEnabled: boolean;
  formulasEnabled: boolean;
  tablesEnabled: boolean;
  prompt?: string;
  onProgress?: (text: string) => void;
}

export function useContent() {
  const embedChunks = useCallback(async (sessionId: string, chunks: Chunk[]) => {
    const needsEmbedding = chunks.filter((c) => !c.embedding || c.embedding.length === 0);
    if (needsEmbedding.length === 0) return chunks;

    const texts = needsEmbedding.map((c) => c.text);
    const hashes = needsEmbedding.map((c) => c.hash || simpleHash(c.text));
    const batches = group(texts, 25);
    const hashBatches = group(hashes, 25);
    let embedIndex = 0;

    for (let b = 0; b < batches.length; b++) {
      const { embeddings } = await embedBatch(sessionId, batches[b], hashBatches[b]);
      for (let i = 0; i < embeddings.length; i++) {
        needsEmbedding[embedIndex].embedding = embeddings[i].embedding;
        needsEmbedding[embedIndex].hash = hashBatches[b][i];
        embedIndex++;
      }
    }

    await docs.saveChunks(needsEmbedding);
    return chunks;
  }, []);

  const generateQuizContent = useCallback(
    async (options: GenerateOptions) => {
      const chunks = await sessions.getChunks(options.sessionId) || [];

      const embedded = await embedChunks(options.sessionId, chunks);
      return await generateQuiz(options.topic, options.numQuestions, embedded, options.difficulty, options.prompt, options.timeLimit, options.onProgress as (quiz: Quiz) => void);
    },
    [embedChunks]
  );

  const generateNotesContent = useCallback(
    async (options: NotesOptions) => {
      const chunks = await sessions.getChunks(options.sessionId) || [];

      const embedded = await embedChunks(options.sessionId, chunks);
      return await generateNotes(options.topic, embedded, options.notesFormat, options.notesLength, options.codeEnabled, options.formulasEnabled, options.diagramsEnabled, options.tablesEnabled, options.prompt, options.onProgress);
    },
    [embedChunks]
  );

  const generateSlidesContent = useCallback(
    async (options: SlidesOptions) => {
      const chunks = await sessions.getChunks(options.sessionId) || [];

      const embedded = await embedChunks(options.sessionId, chunks);
      return await generateSlides(options.topic, embedded, options.numSlides, options.slideDesign, options.codeEnabled, options.formulasEnabled, options.tablesEnabled, options.prompt, options.onProgress);
    },
    [embedChunks]
  );

  return { embedChunks, generateQuizContent, generateNotesContent, generateSlidesContent };
}
