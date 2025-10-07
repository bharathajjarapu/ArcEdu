"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@/types";
import * as sessions from "@/lib/storage/sessions";

// Provides a React context and provider for managing user sessions across the application

interface SessionContextValue {
  current: Session | null;
  all: Session[];
  loading: boolean;
  setCurrent: (session: Session | null) => void;
  create: (title: string) => Promise<Session>;
  update: (id: string, data: Partial<Session>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const CURRENT_SESSION_KEY = "current-session-id";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Session | null>(null);
  const [all, setAll] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await sessions.getAll();
      setAll(list);
      if (typeof window !== "undefined") {
        const currentId = window.sessionStorage.getItem(CURRENT_SESSION_KEY);
        if (currentId) {
          const savedCurrent = list.find((session) => session.id === currentId) || null;
          setCurrent(savedCurrent);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const create = async (title: string) => {
    const session = await sessions.create(title);
    setAll((prev) => [...prev, session]);
    setCurrent(session);
    return session;
  };

  const update = async (id: string, data: Partial<Session>) => {
    await sessions.update(id, data);
    const updated = await sessions.getById(id);
    if (updated) {
      setCurrent((prev) => (prev?.id === id ? updated : prev));
      setAll((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  const remove = async (id: string) => {
    await sessions.remove(id);
    setAll((prev) => prev.filter((s) => s.id !== id));
    if (current?.id === id) {
      setCurrent(null);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (current?.id) {
      window.sessionStorage.setItem(CURRENT_SESSION_KEY, current.id);
      return;
    }

    window.sessionStorage.removeItem(CURRENT_SESSION_KEY);
  }, [current]);

  return (
    <SessionContext.Provider
      value={{
        current,
        all,
        loading,
        setCurrent,
        create,
        update,
        remove,
        refresh,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context)
    throw new Error("useSession must be used within SessionProvider");
  return context;
}
