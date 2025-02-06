import { useCallback } from "react";
import type { Quiz, Flashcard, Chunk, Difficulty } from "@/types";
import * as sessions from "@/lib/storage/sessions";
import * as docs from "@/lib/storage/docs";
import { simple as simpleHash } from "@/lib/data/hash";
import { group } from "@/lib/process/batch";
import { embedBatch, generateQuiz, generateFlashcards } from "@/lib/api/client";

interface GenerateOptions {
    sessionId: string;
    topic: string;
    numQuestions: number;
    difficulty?: Difficulty;
    prompt?: string;
    onProgress?: (item: Quiz | Flashcard) => void;
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

        // Batch save all chunks at once instead of sequential saves
        await docs.saveChunks(needsEmbedding);
        return await sessions.getChunks(sessionId);
    }, []);

    const generateQuizContent = useCallback(
        async (options: GenerateOptions) => {
            const chunks = await sessions.getChunks(options.sessionId);
            if (!chunks || chunks.length === 0) {
                throw new Error("No document content available");
            }

            const embedded = await embedChunks(options.sessionId, chunks);
            return await generateQuiz(options.topic, options.numQuestions, embedded, options.difficulty, options.prompt, options.onProgress as (quiz: Quiz) => void);
        },
        [embedChunks]
    );

    const generateFlashcardContent = useCallback(
        async (options: GenerateOptions) => {
            const chunks = await sessions.getChunks(options.sessionId);
            if (!chunks || chunks.length === 0) {
                throw new Error("No document content available");
            }

            const embedded = await embedChunks(options.sessionId, chunks);
            return await generateFlashcards(options.topic, options.numQuestions, embedded, options.difficulty, options.prompt, options.onProgress as (flashcard: Flashcard) => void);
        },
        [embedChunks]
    );

    return { embedChunks, generateQuizContent, generateFlashcardContent };
}
