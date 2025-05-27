"use client";

import { useEffect, useRef, useMemo } from "react";
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Loader2 } from "lucide-react";

interface NotesProps {
    content: string;
    isGenerating: boolean;
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function normalizeMathDelimiters(input: string): string {
    const fencedSplit = input.split(/(```[\s\S]*?```)/g);
    const processInline = (segment: string) => {
        const inlineSplit = segment.split(/(`[^`]*`)/g);
        return inlineSplit
            .map((part) => {
                if (part.startsWith("`") && part.endsWith("`")) return part;
                let replaced = part.replace(/\\\[([\s\S]*?)\\\]/g, (_, p1) => `$$${p1}$$`);
                replaced = replaced.replace(/\\\(([^]*?)\\\)/g, (_, p1) => `$${p1}$`);
                return replaced;
            })
            .join("");
    };
    return fencedSplit
        .map((seg) => (seg.startsWith("```") ? seg : processInline(seg)))
        .join("");
}

function renderMath(html: string): string {
    html = decodeHtmlEntities(html);

    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
        try {
            const cleanTex = tex.replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/gi, ' ').trim();
            return `<div style="overflow-x:auto;padding:0.5rem 0;text-align:center">${katex.renderToString(cleanTex, { displayMode: true, throwOnError: false })}</div>`;
        } catch {
            return `<code>${tex}</code>`;
        }
    });

    html = html.replace(/\$([^$]+?)\$/g, (match, tex) => {
        if (!tex || tex.trim().length === 0) return match;
        try {
            const cleanTex = tex.replace(/<br\s*\/?>/gi, ' ').replace(/&nbsp;/gi, ' ').trim();
            return katex.renderToString(cleanTex, { displayMode: false, throwOnError: false });
        } catch {
            return `<code>${tex}</code>`;
        }
    });

    return html;
}

export function NotesScreen({ content, isGenerating }: NotesProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const renderedHtml = useMemo(() => {
        if (!content) return "";
        const normalized = normalizeMathDelimiters(content);
        const html = marked.parse(normalized, { async: false, gfm: true, breaks: false }) as string;
        return renderMath(html);
    }, [content]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = renderedHtml;
        }
    }, [renderedHtml]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 top-[72px] bg-gray-50 bg-dots overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 py-6 h-full">
                <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col">
                    {isGenerating && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating notes...</span>
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        className="p-6 overflow-y-auto flex-1 text-gray-700 leading-relaxed
                            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:pb-2 [&_h1]:border-b-2 [&_h1]:border-gray-200 [&_h1:first-child]:mt-0
                            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mt-5 [&_h2]:mb-3
                            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mt-4 [&_h3]:mb-2
                            [&_p]:my-3
                            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1
                            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1
                            [&_li]:my-1
                            [&_code]:font-mono [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-gray-800
                            [&_pre]:bg-gray-100 [&_pre]:text-gray-800 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:border-2 [&_pre]:border-gray-300
                            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit
                            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-gray-600 [&_blockquote]:italic
                            [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border-2 [&_table]:border-gray-200 [&_table]:rounded-lg [&_table]:overflow-hidden
                            [&_th]:bg-gray-100 [&_th]:font-semibold [&_th]:text-left [&_th]:px-4 [&_th]:py-2 [&_th]:border [&_th]:border-gray-200
                            [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-gray-200
                            [&_tr:nth-child(even)]:bg-gray-50
                            [&_hr]:border-0 [&_hr]:border-t-2 [&_hr]:border-gray-200 [&_hr]:my-6
                            [&_a]:text-blue-600 [&_a]:underline
                            [&_strong]:font-semibold [&_strong]:text-gray-900
                            [&_.katex]:text-[1.1em]"
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
