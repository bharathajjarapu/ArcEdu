"use client";

import { useState, useCallback } from "react";
import * as store from "@/lib/storage/store";

type StoreName = "sessions" | "documents" | "chunks" | "quizzes" | "flashcards";

export function useStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async <T>(storeName: StoreName, id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await store.get<T>(storeName, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Storage error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAll = useCallback(async <T>(storeName: StoreName) => {
    setLoading(true);
    setError(null);
    try {
      return await store.getAll<T>(storeName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Storage error");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getByIndex = useCallback(
    async <T>(storeName: StoreName, index: string, value: string) => {
      setLoading(true);
      setError(null);
      try {
        return await store.getByIndex<T>(storeName, index, value);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Storage error");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const put = useCallback(async <T>(storeName: StoreName, data: T) => {
    setLoading(true);
    setError(null);
    try {
      await store.put(storeName, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Storage error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (storeName: StoreName, id: string) => {
    setLoading(true);
    setError(null);
    try {
      await store.remove(storeName, id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Storage error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { get, getAll, getByIndex, put, remove, loading, error };
}
