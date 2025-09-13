"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { marked } from "marked";
import "katex/dist/katex.min.css";
import { Loader2, Download, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { decodeHtmlEntities, normalizeMathDelimiters, renderMath } from "@/lib/markdown";

declare global { interface Window { mermaid?: { initialize: (c: object) => void; render: (id: string, code: string) => Promise<{ svg: string }> } } }

let mermaidPromise: Promise<typeof window.mermaid> | null = null;

function loadMermaid(): Promise<typeof window.mermaid> {
    if (window.mermaid) return Promise.resolve(window.mermaid);
    if (mermaidPromise) return mermaidPromise;
    mermaidPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
        script.onload = () => {
            window.mermaid?.initialize({ startOnLoad: false, theme: "base", themeVariables: { background: "#fff", primaryColor: "#f3f4f6", primaryTextColor: "#111827", primaryBorderColor: "#d1d5db", lineColor: "#6b7280", secondaryColor: "#f9fafb", tertiaryColor: "#f3f4f6", nodeRadius: "8px" } });
            resolve(window.mermaid);
        };
        script.onerror = () => { mermaidPromise = null; reject(); };
        document.head.appendChild(script);
    });
    return mermaidPromise;
}

interface NotesProps {
    content: string;
    isGenerating: boolean;
    onEnd?: () => void;
}

// Utility functions now imported from @/lib/markdown

export function NotesScreen({ content, isGenerating, onEnd }: NotesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const { title, body } = useMemo(() => {
        if (!content) return { title: "", body: "" };
        const lines = content.split(/\r?\n/);
        let foundTitle = "";
        let skippedTopHr = false;
        const filtered: string[] = [];
        for (const line of lines) {
            if (!foundTitle) {
                const m = line.match(/^#\s+(.+)/);
                if (m) {
                    foundTitle = m[1].trim();
                    continue;
                }
            }
            if (!skippedTopHr && /^(-{3,}|\*{3,})\s*$/.test(line)) {
                skippedTopHr = true;
                continue;
            }
            if (line.trim() !== "") skippedTopHr = true;
            filtered.push(line);
        }
        return { title: foundTitle, body: filtered.join("\n") };
    }, [content]);

    const renderedHtml = useMemo(() => {
        if (!body) return "";
        const normalized = normalizeMathDelimiters(body);
        const html = marked.parse(normalized, { async: false, gfm: true, breaks: false }) as string;
        return renderMath(html);
    }, [body]);

    const renderMermaid = useCallback(async () => {
        if (!containerRef.current) return;
        const blocks = containerRef.current.querySelectorAll('pre code');
        if (blocks.length === 0) return;
        const mermaid = await loadMermaid().catch(() => null);
        if (!mermaid) return;
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i], pre = block.parentElement;
            if (!pre || pre.dataset.rendered) continue;
            const cls = block.className || "";
            const code = (block.textContent || "").trim();
            const looksMermaid = cls.includes("mermaid") || /^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|journey)\b/.test(code);
            if (!looksMermaid || !code || code.length < 10) continue; // skip incomplete/non-mermaid
            block.classList.add("language-mermaid", "mermaid");
            pre.dataset.rendered = "1";
            try {
                const { svg } = await mermaid.render(`m-${i}-${Date.now()}`, code);
                const div = document.createElement("div");
                div.className = "mermaid-diagram";
                div.innerHTML = svg;
                div.querySelectorAll("rect").forEach(r => { r.setAttribute("rx", "8"); r.setAttribute("ry", "8"); });
                pre.replaceWith(div);
                await new Promise((r) => requestAnimationFrame(r)); // yield to keep UI smooth while streaming
            } catch { /* invalid diagram */ }
        }
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = renderedHtml;
        requestAnimationFrame(() => renderMermaid());
        setTimeout(() => renderMermaid(), 60);
    }, [renderedHtml, renderMermaid]);

    // After streaming finishes, run a final render pass to catch late diagrams
    useEffect(() => {
        if (isGenerating) return;
        requestAnimationFrame(() => renderMermaid());
        setTimeout(() => renderMermaid(), 80);
    }, [isGenerating, renderMermaid]);


    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleDownload = useCallback(() => {
        if (!content) return;
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "notes"}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [content, title]);

    const handleRetry = useCallback(() => {
        router.push("/format");
    }, [router]);

    const handleEnd = useCallback(() => {
        onEnd?.();
        window.stop();
    }, [onEnd]);

    return (
        <div className="fixed inset-0 top-[72px] bg-gray-50 bg-dots overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 py-6 h-full">
                <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col">
                    <div className="flex items-center justify-between text-sm text-gray-600 px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{isGenerating ? "Generating notes..." : (title || "Notes")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleRetry} className="h-8 px-3 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition">
                                <RefreshCw className="w-4 h-4" />
                                <span className="text-xs font-semibold">Retry</span>
                            </button>
                            {isGenerating && (
                                <button onClick={handleEnd} className="h-8 px-3 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition">
                                    <X className="w-4 h-4" />
                                    <span className="text-xs font-semibold">End</span>
                                </button>
                            )}
                            {!isGenerating && (
                                <button onClick={handleDownload} className="h-8 px-3 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition">
                                    <Download className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Download</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {!isGenerating && title && null}

                    <div
                        ref={containerRef}
                        className="px-6 pb-6 overflow-y-auto flex-1 text-gray-700 leading-relaxed
                            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-4 [&_h1:first-child]:mt-0
                            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mt-5 [&_h2]:mb-3
                            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mt-4 [&_h3]:mb-2
                            [&_p]:my-3
                            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1
                            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1
                            [&_li]:my-1
                            [&_code]:font-mono [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-gray-800
                            [&_pre]:bg-gray-100 [&_pre]:text-gray-800 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:border-2
                            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
                            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-gray-600 [&_blockquote]:italic
                            [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border-2 [&_table]:border-gray-200 [&_table]:rounded-md [&_table]:overflow-hidden
                            [&_th]:bg-gray-100 [&_th]:font-semibold [&_th]:text-left [&_th]:px-4 [&_th]:py-2 [&_th]:border [&_th]:border-gray-200
                            [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-gray-200
                            [&_tr:nth-child(even)]:bg-gray-50
                            [&_hr]:border-0 [&_hr]:border-t-2 [&_hr]:border-gray-200 [&_hr]:my-6
                            [&_a]:text-blue-600 [&_a]:underline
                            [&_strong]:font-semibold [&_strong]:text-gray-900
                            [&_.katex]:text-[1.1em]
                            [&_.mermaid-diagram]:my-4 [&_.mermaid-diagram]:flex [&_.mermaid-diagram]:justify-center [&_.mermaid-diagram_svg]:max-w-full"
                    >
                        {!content && !isGenerating && (
                            <p className="text-gray-400 italic text-center py-12">Your notes will appear here...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
