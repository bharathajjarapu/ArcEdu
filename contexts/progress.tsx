"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface Progress {
  sessionId: string;
  type: "upload" | "chunk" | "embed" | "generate";
  current: number;
  total: number;
  message?: string;
}

interface ProgressContextValue {
  progress: Map<string, Progress>;
  set: (sessionId: string, data: Omit<Progress, "sessionId">) => void;
  clear: (sessionId: string) => void;
  get: (sessionId: string) => Progress | undefined;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Map<string, Progress>>(new Map());

  const set = (sessionId: string, data: Omit<Progress, "sessionId">) => {
    setProgress((prev) => {
      const next = new Map(prev);
      next.set(sessionId, { sessionId, ...data });
      return next;
    });
  };

  const clear = (sessionId: string) => {
    setProgress((prev) => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
  };

  const get = (sessionId: string) => {
    return progress.get(sessionId);
  };

  return (
    <ProgressContext.Provider value={{ progress, set, clear, get }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used within ProgressProvider");
  return context;
}
