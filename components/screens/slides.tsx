"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, Spinner } from "@/components/icons";
import { Button, Tip, buttonVariants, cn } from "@/components/ui";
import { palettes } from "@/components/screens/format";
import { useApp } from "@/contexts/app";
import { download, render } from "@/lib/markdown";

// Slide typography in container units, so it scales with the slide on any screen and when presenting.
const type = cn(
  "p-[6cqw] font-heading leading-snug [&_h1]:mb-[2.5cqw] [&_h1]:text-[max(1.25rem,4.6cqw)] [&_h1]:font-bold [&_h2]:mb-[2cqw] [&_h2]:text-[max(1rem,3.4cqw)] [&_h2]:font-semibold",
  "[&_p]:mb-[2cqw] [&_:is(p,li)]:text-[max(0.8rem,2.4cqw)] [&_:is(ol,ul)]:space-y-[1cqw] [&_:is(ol,ul)]:pl-[4cqw] [&_ol]:list-decimal [&_ul]:list-disc",
  "[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:font-mono [&_pre]:my-[2cqw] [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/20 [&_pre]:p-[2cqw] [&_pre_code]:bg-transparent",
  "[&_table]:my-[2cqw] [&_table]:w-full [&_:is(td,th)]:px-[1.5cqw] [&_:is(td,th)]:py-[1cqw] [&_:is(td,th)]:text-left [&_:is(td,th)]:text-[max(0.7rem,2cqw)] [&_th]:bg-black/10 [&_td]:border-t [&_td]:border-black/10 [&_.katex]:text-[max(0.9rem,2.6cqw)]",
);
const light = "flex size-9 items-center justify-center rounded-lg outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/50 disabled:opacity-50";

// Slides step: navigate, present and download generated slides.
export function Slides() {
  const { slides: content, busy, error, stop, options } = useApp();
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const slides = content.split(/^---+\s*$/m).filter((slide) => slide.trim());
  const total = slides.length;
  const shown = Math.min(index, Math.max(0, total - 1));

  // Moves by a number of slides, staying in range.
  const go = (step: number) => setIndex(Math.min(Math.max(0, shown + step), Math.max(0, total - 1)));

  // Enters or leaves fullscreen presenting.
  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : ref.current?.requestFullscreen());

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") go(1);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key.toLowerCase() === "f") void toggle();
    };
    const change = () => setFull(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", keys);
    document.addEventListener("fullscreenchange", change);
    return () => {
      window.removeEventListener("keydown", keys);
      document.removeEventListener("fullscreenchange", change);
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-2 pb-6 sm:px-6 md:h-full">
      <div ref={ref} className={cn("relative flex min-h-0 flex-1 items-center justify-center", full && "bg-black")}>
        <section
          aria-roledescription="slide"
          aria-label={total ? `Slide ${shown + 1} of ${total}` : "Slides"}
          className={cn(
            "@container relative aspect-video w-full overflow-hidden",
            // Width follows the free height, so the whole slide always fits on screen.
            full ? "max-w-[calc(100dvh*16/9)]" : "rounded-xl border md:max-w-[calc((100dvh-9.5rem)*16/9)]",
            palettes[options.palette],
          )}
        >
          {total > 0 ? (
            <div className={cn("absolute inset-0 overflow-auto", type)} dangerouslySetInnerHTML={{ __html: render(slides[shown]) }} />
          ) : (
            <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-(--dim)">
              {busy ? <><Spinner className="size-8" /><p>Generating slides…</p></> : <p>{error || "Your slides will appear here."}</p>}
            </div>
          )}
        </section>

        {full && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-black/80 px-3 py-2 text-white">
            <button aria-label="Previous slide" onClick={() => go(-1)} disabled={shown === 0} className={light}>
              <Icon name="chevron-left" className="size-5" />
            </button>
            <span className="min-w-16 text-center text-sm tabular-nums">{shown + 1} / {total}</span>
            <button aria-label="Next slide" onClick={() => go(1)} disabled={shown >= total - 1} className={light}>
              <Icon name="chevron-right" className="size-5" />
            </button>
            <button aria-label="Exit presenting" onClick={() => void toggle()} className={light}>
              <Icon name="minimize-2" className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tip label="Previous slide">
          <Button variant="outline" size="icon" aria-label="Previous slide" onClick={() => go(-1)} disabled={shown === 0}>
            <Icon name="chevron-left" />
          </Button>
        </Tip>
        <span className="min-w-14 text-center text-sm text-muted-foreground tabular-nums">{total ? `${shown + 1} / ${total}` : "–"}</span>
        <Tip label="Next slide">
          <Button variant="outline" size="icon" aria-label="Next slide" onClick={() => go(1)} disabled={shown >= total - 1}>
            <Icon name="chevron-right" />
          </Button>
        </Tip>
        <div className="flex-1" />
        <Tip label="Regenerate">
          <Link href="/format" aria-label="Regenerate slides" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <Icon name="refresh-cw" />
          </Link>
        </Tip>
        {busy ? (
          <Button variant="outline" onClick={stop}>
            <Icon name="x" /> Stop
          </Button>
        ) : (
          <Button variant="outline" disabled={!content} onClick={() => download("slides.md", content)}>
            <Icon name="download" /> <span className="max-sm:sr-only">Download</span>
          </Button>
        )}
        <Button onClick={() => void toggle()} disabled={total === 0}>
          <Icon name="maximize-2" /> Present
        </Button>
      </div>
    </div>
  );
}
