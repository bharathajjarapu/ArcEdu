"use client";

import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { marked } from "marked";
import "katex/dist/katex.min.css";
import { Loader2, Download, RefreshCw, X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { normalizeMathDelimiters, renderMath, sanitizeHtml } from "@/lib/markdown";
import { cancelSlidesGeneration } from "@/lib/api/client";
import { PageBackButton } from "@/components/page-back-button";

import type { SlideColorPalette } from "@/types";

interface SlidesProps {
  content: string;
  isGenerating: boolean;
  error?: string | null;
  currentSlide: number;
  slideDesign: string;
  slideColorPalette: SlideColorPalette;
  onSlideChange: (index: number) => void;
  onEnd?: () => void;
  onBackAction: () => void;
}

// Utility functions now imported from @/lib/markdown

const colorPaletteThemes: Record<SlideColorPalette, { bg: string; text: string; accent: string }> = {
  minimal: { bg: "bg-white", text: "text-gray-900", accent: "text-gray-500" },
  dark: { bg: "bg-gradient-to-br from-zinc-900 to-zinc-800", text: "text-white", accent: "text-zinc-400" },
  colorful: { bg: "bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400", text: "text-white", accent: "text-white/80" },
  ocean: { bg: "bg-gradient-to-br from-blue-600 to-cyan-500", text: "text-white", accent: "text-blue-100" },
  forest: { bg: "bg-gradient-to-br from-emerald-700 to-green-500", text: "text-white", accent: "text-emerald-100" },
  sunset: { bg: "bg-gradient-to-br from-orange-500 to-rose-500", text: "text-white", accent: "text-orange-100" },
  purple: { bg: "bg-gradient-to-br from-purple-700 to-indigo-600", text: "text-white", accent: "text-purple-100" },
};

export function SlidesScreen({ content, isGenerating, error, currentSlide, slideDesign, slideColorPalette, onSlideChange, onEnd, onBackAction }: SlidesProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    if (!content) return [];
    const parts = content.split(/^---+$/m).filter((s) => s.trim());
    return parts.map((slide) => {
      const normalized = normalizeMathDelimiters(slide.trim());
      const html = marked.parse(normalized, { async: false, gfm: true, breaks: false }) as string;
      return renderMath(sanitizeHtml(html));
    });
  }, [content]);

  const theme = colorPaletteThemes[slideColorPalette] || colorPaletteThemes.colorful;
  const total = slides.length;
  const safeIndex = Math.min(currentSlide, Math.max(0, total - 1));

  const goNext = useCallback(() => {
    if (safeIndex < total - 1) onSlideChange(safeIndex + 1);
  }, [safeIndex, total, onSlideChange]);

  const goPrev = useCallback(() => {
    if (safeIndex > 0) onSlideChange(safeIndex - 1);
  }, [safeIndex, onSlideChange]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, isFullscreen, toggleFullscreen]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);



  const handleDownload = useCallback(() => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slides.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [content]);

  const handleRetry = useCallback(() => {
    router.push("/format");
  }, [router]);

  const handleEnd = useCallback(() => {
    cancelSlidesGeneration();
    onEnd?.();
  }, [onEnd]);

  return (
    <div ref={containerRef} className={cn("bg-gray-50 bg-dots overflow-hidden flex flex-col", isFullscreen ? "fixed inset-0" : "h-full")}>
      {/* Slide Area with Arrows */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {/* Left Arrow */}
        <button
          onClick={goPrev}
          disabled={safeIndex === 0 || total === 0}
          aria-label="Previous slide"
          className="shrink-0 w-12 h-12 rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition mr-4"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Slide */}
        <div className={cn("relative flex-1 max-w-7xl h-full max-h-[75vh] rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 shadow-2xl overflow-hidden", theme.bg)}>
          {slides.length > 0 ? (
            <div
              className={cn(
                "absolute inset-0 p-12 md:p-16 overflow-auto",
                theme.text,
                "[&_h1]:text-5xl [&_h1]:font-bold [&_h1]:mb-8",
                "[&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mb-5",
                "[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mb-4",
                "[&_p]:text-2xl [&_p]:leading-relaxed [&_p]:mb-5",
                "[&_ul]:list-disc [&_ul]:pl-8 [&_ul]:space-y-3 [&_ul]:text-2xl",
                "[&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:space-y-3 [&_ol]:text-2xl",
                "[&_li]:leading-relaxed",
                "[&_code]:font-mono [&_code]:text-lg [&_code]:bg-black/10 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded",
                "[&_pre]:bg-black/20 [&_pre]:p-6 [&_pre]:rounded-[calc(var(--radius)+2px)] [&_pre]:overflow-x-auto [&_pre]:my-5",
                "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                "[&_table]:w-full [&_table]:my-5 [&_table]:border-collapse",
                "[&_th]:bg-black/10 [&_th]:px-5 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-xl",
                "[&_td]:px-5 [&_td]:py-3 [&_td]:border-t [&_td]:border-black/10 [&_td]:text-xl",
                "[&_.math-block]:my-6 [&_.math-block]:text-center",
                "[&_.katex]:text-3xl"
              )}
              dangerouslySetInnerHTML={{ __html: slides[safeIndex] || "" }}
            />
          ) : isGenerating ? (
            <div className={cn("absolute inset-0 flex items-center justify-center", theme.accent)}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                <p className="text-xl font-medium text-gray-500">Generating Slides...</p>
              </div>
            </div>
          ) : error ? (
            <div className={cn("absolute inset-0 flex items-center justify-center px-6 text-center", theme.accent)}>
              <p className="text-xl text-red-500">{error}</p>
            </div>
          ) : (
            <div className={cn("absolute inset-0 flex items-center justify-center", theme.accent)}>
              <p className="text-2xl italic">Your slides will appear here...</p>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={goNext}
          disabled={safeIndex >= total - 1 || total === 0}
          aria-label="Next slide"
          className="shrink-0 w-12 h-12 rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition ml-4"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Bottom Navigation - Buttons and Slide Count */}
      {!isFullscreen && (
        <div className="shrink-0 py-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <PageBackButton label="Back to Format" onClick={onBackAction} />
            <button aria-label="Retry slide generation" onClick={handleRetry} className="h-10 px-5 rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition text-sm font-semibold">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            {isGenerating ? (
              <button aria-label="Stop slide generation" onClick={handleEnd} className="h-10 px-5 rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition text-sm font-semibold">
                <X className="w-4 h-4" /> End
              </button>
            ) : (
              <button aria-label="Download slides" onClick={handleDownload} className="h-10 px-5 rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition text-sm font-semibold">
                <Download className="w-4 h-4" /> Download
              </button>
            )}
            <button aria-label="Present slides" onClick={toggleFullscreen} className="h-10 px-5 rounded-[calc(var(--radius)+2px)] border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition text-sm font-semibold">
              <Maximize2 className="w-4 h-4" /> Present
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Mode */}
      {isFullscreen && (
        <>
          <div className={cn("absolute inset-0 flex items-center justify-center", theme.bg)}>
            <div className="w-full h-full p-12">
              {slides.length > 0 && (
                <div
                  className={cn(
                    "w-full h-full overflow-auto p-16",
                    theme.text,
                    "[&_h1]:text-7xl [&_h1]:font-bold [&_h1]:mb-10",
                    "[&_h2]:text-5xl [&_h2]:font-semibold [&_h2]:mb-8",
                    "[&_h3]:text-4xl [&_h3]:font-semibold [&_h3]:mb-6",
                    "[&_p]:text-3xl [&_p]:leading-relaxed [&_p]:mb-6",
                    "[&_ul]:list-disc [&_ul]:pl-12 [&_ul]:space-y-4 [&_ul]:text-3xl",
                    "[&_ol]:list-decimal [&_ol]:pl-12 [&_ol]:space-y-4 [&_ol]:text-3xl",
                    "[&_li]:leading-relaxed",
                    "[&_code]:font-mono [&_code]:text-2xl [&_code]:bg-black/10 [&_code]:px-3 [&_code]:py-1 [&_code]:rounded",
                    "[&_pre]:bg-black/20 [&_pre]:p-8 [&_pre]:rounded-[calc(var(--radius)+2px)] [&_pre]:overflow-x-auto [&_pre]:my-6",
                    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                    "[&_table]:w-full [&_table]:my-8 [&_table]:border-collapse",
                    "[&_th]:bg-black/10 [&_th]:px-6 [&_th]:py-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-2xl",
                    "[&_td]:px-6 [&_td]:py-4 [&_td]:border-t [&_td]:border-black/10 [&_td]:text-2xl",
                    "[&_.math-block]:my-10 [&_.math-block]:text-center",
                    "[&_.katex]:text-4xl"
                  )}
                  dangerouslySetInnerHTML={{ __html: slides[safeIndex] || "" }}
                />
              )}
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-[calc(var(--radius)+2px)] px-4 py-3 border border-white/10">
            <button aria-label="Previous slide" onClick={goPrev} disabled={safeIndex === 0} className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+2px)] text-white transition hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-white text-sm font-medium min-w-20 text-center">
              {safeIndex + 1} / {total}
            </span>
            <button aria-label="Next slide" onClick={goNext} disabled={safeIndex >= total - 1} className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+2px)] text-white transition hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="w-px h-5 bg-white/30" />
            <button aria-label="Exit fullscreen" onClick={toggleFullscreen} className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius)+2px)] text-white transition hover:bg-white/10">
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
