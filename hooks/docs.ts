"use client";

import { useState, useCallback } from "react";
import * as docs from "@/lib/storage/docs";
import type { Document, Chunk } from "@/types";
import { chunk as chunkText } from "@/lib/process/chunk";

export function useDocuments(sessionId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await docs.getBySession(sessionId);
      setDocuments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const add = useCallback(
    async (name: string, size: string, content: string) => {
      if (!sessionId) {
        console.error("No session selected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const doc = await docs.create(sessionId, name, size, content);
        setDocuments((prev) => [...prev, doc]);
        return doc;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add document");
        console.error("Add document error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId],
  );

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await docs.remove(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove document",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const processChunks = useCallback(
    async (documentId: string, content: string) => {
      if (!sessionId) throw new Error("No session selected");
      const textChunks = chunkText(content);
      const chunks: Chunk[] = textChunks.map((text, index) => ({
        id: crypto.randomUUID(),
        sessionId,
        documentId,
        text,
        embedding: [],
        index,
      }));
      await docs.saveChunks(chunks);
      return chunks;
    },
    [sessionId],
  );

  const getChunks = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await docs.getChunks(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get chunks");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    load,
    add,
    remove,
    processChunks,
    getChunks,
  };
}
