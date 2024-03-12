"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Screen, Progress } from "@/types";

interface AppContextValue {
  screen: Screen;
  loading: boolean;
  error: string | null;
  progress: Progress | null;
  setScreen: (screen: Screen) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgress: (progress: Progress | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("sessions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  return (
    <AppContext.Provider
      value={{
        screen,
        loading,
        error,
        progress,
        setScreen,
        setLoading,
        setError,
        setProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
