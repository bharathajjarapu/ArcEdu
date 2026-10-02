"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as db from "@/lib/db";
import { config, llm, ocr } from "@/lib/llm";
import { prompts } from "@/lib/prompts";
import * as rag from "@/lib/rag";
import type { Doc, Options, Play, Question, Session } from "@/types";

// Characters of retrieved material sent per generation (~10k tokens).
const budget = 40_000;

const defaults: Options = {
  format: "quiz",
  prompt: "",
  questions: 5,
  difficulty: "medium",
  minutes: 5,
  reveal: true,
  style: "structured",
  length: "medium",
  extras: ["code", "formulas", "diagrams", "tables"],
  slides: 10,
  design: "professional",
  palette: "colorful",
  speaker: true,
};

export const fresh: Play = { questions: [], index: 0, answers: {}, start: 0, shown: 0, end: 0, times: [], streak: 0, best: 0 };

// State mirrored to sessionStorage so a reload keeps it.
function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = sessionStorage.getItem(key);
    if (raw) setValue(JSON.parse(raw));
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value, ready]);
  return [value, setValue] as const;
}

// Parses the complete JSON question lines streamed so far.
function parse(text: string): Question[] {
  return text.split("\n").flatMap((line) => {
    try {
      const item = JSON.parse(line.trim().replace(/,$/, ""));
      return Array.isArray(item?.options) && Number.isInteger(item.answer) ? [item] : [];
    } catch {
      return [];
    }
  });
}

// Streams a generation from the LLM's server-sent events, reporting the text so far.
async function stream(body: Record<string, unknown>, signal: AbortSignal, onText: (text: string) => void) {
  const [system, prompt] = prompts(body);
  const response = await llm([{ role: "system", content: system }, { role: "user", content: prompt }], { stream: true, signal });
  if (!response.body) throw new Error("Generation failed");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let text = "";
  let buffer = "";
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    const events = (buffer + chunk.value).split("\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const data = event.replace(/^data:\s*/, "").trim();
      if (event.startsWith("data:") && data !== "[DONE]") text += JSON.parse(data).choices?.[0]?.delta?.content ?? "";
    }
    onText(text);
  }
  return text;
}

// Everything the screens share: sessions, documents, options and generated output.
function useValue() {
  const router = useRouter();
  const [sessionId, setSessionId] = useStored<string | null>("session", null);
  const [options, setOptions] = useStored("options", defaults);
  const [play, setPlay] = useStored("play", fresh);
  const [notes, setNotes] = useStored("notes", "");
  const [slides, setSlides] = useStored("slides", "");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [side, setSide] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [indexing, setIndexing] = useState(false);
  const controller = useRef<AbortController>(null);
  const current = sessions.find((session) => session.id === sessionId) ?? null;

  // Reloads sessions and the active session's documents.
  const load = async (id = sessionId) => {
    const [list, files] = await Promise.all([db.all<Session>("sessions"), id ? db.list<Doc>("documents", id) : []]);
    setSessions(list.toSorted((a, b) => b.updatedAt - a.updatedAt));
    setDocs(files);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [sessionId]);

  // Converts files with AnyDoc and saves them to the active session, creating one if needed.
  const upload = async (files: File[]) => {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setPending(files.map((file) => file.name));
    const now = Date.now();
    const title = files[0].name.replace(/\.[^.]+$/, "").replace(/[_\-.\s]+/g, " ").trim();
    const session = current ?? { id: crypto.randomUUID(), title: title || "New session", createdAt: now };
    const results = await Promise.allSettled(files.map(async (file) => {
      const form = new FormData();
      form.append("file", file);
      // Images and scans are transcribed in the browser so the API key stays local.
      const data = file.type.startsWith("image/")
        ? { ocr: true }
        : await fetch("/api/parse", { method: "POST", body: form }).then((response) => response.json()).catch(() => ({ error: "Upload failed" }));
      const markdown = data.ocr ? await ocr(file) : data.markdown;
      if (!markdown?.trim()) throw new Error(`${file.name}: ${data.error ?? "No text found"}`);
      const size = file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
      await db.put("documents", { id: crypto.randomUUID(), sessionId: session.id, name: file.name, size, content: markdown, createdAt: now });
    }));
    const failed = results.flatMap((result) => result.status === "rejected" ? [result.reason.message] : []);
    if (failed.length > 0) setError(failed.join(" · "));
    if (failed.length < files.length) {
      await db.put("sessions", { ...session, updatedAt: now });
      setSessionId(session.id);
      await load(session.id);
      setIndexing(true);
      void rag.index(session.id).catch(() => undefined).finally(() => setIndexing(false));
    }
    setPending([]);
    setBusy(false);
  };

  // Generates the chosen format from the session's documents and saves it.
  const generate = async () => {
    const { format } = options;
    if (!current || docs.length === 0) return setError("Upload documents first");
    if (!config().url || !config().model) return setError("Add your API settings in Settings first");
    controller.current?.abort();
    const abort = (controller.current = new AbortController());
    setBusy(true);
    setError(null);

    try {
      const context = await rag.search(current.id, options.prompt.trim(), budget);
      if (format === "quiz") {
        setPlay({ ...fresh, start: Date.now(), shown: Date.now() });
        let count = 0;
        const text = await stream({ ...options, kind: format, context }, abort.signal, (text) => {
          const questions = parse(text);
          if (questions.length === count) return;
          if (count === 0) router.push("/quiz");
          count = questions.length;
          setPlay((play) => ({ ...play, questions }));
        });
        if (parse(text).length === 0) throw new Error("No questions came back, try again");
      } else {
        const set = format === "notes" ? setNotes : setSlides;
        set("");
        router.push(`/${format}`);
        const content = await stream({ ...options, kind: format, context }, abort.signal, set);
        const match = content.match(/^#\s+(.+)|"title":\s*"([^"]+)"/m);
        const title = match?.[1] ?? match?.[2] ?? current.title;
        await db.put(format, { id: crypto.randomUUID(), sessionId: current.id, title, content, createdAt: Date.now() });
      }
    } catch (error) {
      if (!abort.signal.aborted) setError(error instanceof Error ? error.message : "Generation failed");
    } finally {
      if (controller.current === abort) setBusy(false);
    }
  };

  // Stops the running generation.
  const stop = () => {
    controller.current?.abort();
    setBusy(false);
  };

  // Clears everything for a new session.
  const reset = () => {
    stop();
    setSessionId(null);
    setOptions(defaults);
    setPlay(fresh);
    setNotes("");
    setSlides("");
    setError(null);
  };

  return {
    sessions, current, docs, loading, busy, error, options, play, notes, slides, side, pending, indexing,
    setSessionId, setSide, setPlay, setNotes, setSlides, setError, load, upload, generate, stop, reset,
    setOptions: (patch: Partial<Options>) => setOptions((options) => ({ ...options, ...patch })),
  };
}

const Context = createContext<ReturnType<typeof useValue> | null>(null);

// Provides the shared app state.
export function AppProvider({ children }: { children: ReactNode }) {
  return <Context value={useValue()}>{children}</Context>;
}

// Reads the shared app state.
export function useApp() {
  const value = use(Context);
  if (!value) throw new Error("useApp needs AppProvider");
  return value;
}
