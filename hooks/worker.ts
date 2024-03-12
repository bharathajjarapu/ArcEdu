"use client";

import { useState, useCallback, useEffect } from "react";
import * as worker from "@/lib/process/worker";

export function useWorker() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    worker.initWorkers();
    return () => worker.terminate();
  }, []);

  const chunk = useCallback(
    async (text: string, size?: number, overlap?: number) => {
      setLoading(true);
      try {
        return await worker.chunkText(text, size, overlap);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const similar = useCallback(
    async (
      query: number[],
      items: Array<{ embedding: number[]; text: string; id?: string }>,
      k?: number,
    ) => {
      setLoading(true);
      try {
        return await worker.findSimilar(query, items, k);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { chunk, similar, loading };
}
