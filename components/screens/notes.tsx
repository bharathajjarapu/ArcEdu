"use client";

import { useDeferredValue, useEffect, useRef } from "react";
import { cn } from "@/components/ui";
import { useApp } from "@/contexts/app";
import { render } from "@/lib/markdown";

interface Mermaid {
  initialize: (config: object) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
}

const url = "https://esm.sh/mermaid@11/dist/mermaid.esm.min.mjs";
let mermaid: Promise<Mermaid> | undefined;

// Loads grayscale mermaid from the CDN once, themed to match the page.
function load() {
  mermaid ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url).then(({ default: api }: { default: Mermaid }) => {
    api.initialize({ startOnLoad: false, suppressErrorRendering: true, theme: document.documentElement.dataset.theme === "dark" ? "dark" : "neutral", fontFamily: "inherit" });
    return api;
  });
  return mermaid;
}

// Replaces finished mermaid code blocks with diagrams.
async function diagrams(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("pre code.language-mermaid"));
  if (blocks.length === 0) return;
  const api = await load().catch(() => null);
  for (const [index, block] of blocks.entries()) {
    const pre = block.parentElement;
    if (!api || !pre?.isConnected) continue;
    try {
      const { svg } = await api.render(`mermaid-${index}-${Date.now()}`, block.textContent ?? "");
      const figure = document.createElement("div");
      figure.className = "mermaid-diagram";
      figure.innerHTML = svg;
      pre.replaceWith(figure);
    } catch {
      // Unfinished or invalid diagram: keep the code.
    }
  }
}

// Notes step: streams, renders and downloads generated notes.
export function Notes() {
  const ref = useRef<HTMLElement>(null);
  const { notes, busy, error } = useApp();
  const content = useDeferredValue(notes);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = render(content);
    if (!busy) void diagrams(ref.current);
  }, [content, busy]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-16 sm:px-6">
      {!notes && !busy && <p className="py-24 text-center text-muted-foreground">{error || "Your notes will appear here."}</p>}
      <article ref={ref} className={cn("markdown", !notes && "hidden")} />
    </div>
  );
}
