"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { Loader2, MessageSquareText } from "lucide-react";
import { useSession } from "@/contexts/session";
import { chatWithSessions } from "@/lib/api/client";
import {
  normalizeMathDelimiters,
  renderMath,
  sanitizeHtml,
} from "@/lib/markdown";
import { cn } from "@/lib/utils";
import * as sessions from "@/lib/storage/sessions";
import type { ChatMessage, Document } from "@/types";

function ChatMarkdown({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) return "";
    const normalized = normalizeMathDelimiters(content);
    const parsed = marked.parse(normalized, {
      async: false,
      gfm: true,
      breaks: true,
    }) as string;
    return renderMath(sanitizeHtml(parsed));
  }, [content]);

  return (
    <div
      className="text-[15px] leading-7 text-gray-800
        [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-gray-900 [&_h1]:mb-3
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1
        [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
        [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5
        [&_code]:rounded-[10px] [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
        [&_pre]:overflow-x-auto [&_pre]:rounded-[14px] [&_pre]:border [&_pre]:border-gray-200 [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:my-3
        [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const WELCOME_ID = "welcome";

export function ChatScreen() {
  const { all, loading } = useSession();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: WELCOME_ID,
      role: "assistant",
      content: "Hello. How can I assist?",
      createdAt: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const sortedSessions = useMemo(
    () => [...all].sort((a, b) => b.updatedAt - a.updatedAt),
    [all],
  );

  const activeSessionIds =
    mode === "all" ? sortedSessions.map((s) => s.id) : selectedSessionIds;

  // Load documents whenever active session scope changes
  useEffect(() => {
    if (sortedSessions.length === 0) {
      setDocs([]);
      return;
    }
    let cancelled = false;
    setDocsLoading(true);
    const ids =
      mode === "all" ? sortedSessions.map((s) => s.id) : selectedSessionIds;
    Promise.all(ids.map((id) => sessions.getDocs(id)))
      .then((groups) => {
        if (!cancelled) {
          const seen = new Set<string>();
          const flat: Document[] = [];
          for (const group of groups) {
            for (const doc of group) {
              if (!seen.has(doc.id)) {
                seen.add(doc.id);
                flat.push(doc);
              }
            }
          }
          setDocs(flat);
        }
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, selectedSessionIds, sortedSessions]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isLoading]);

  const toggleSession = (sessionId: string) => {
    setError(null);
    setMode("selected");
    setSelectedSessionIds((prev) => {
      const next = prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId];
      if (next.length === 0) setMode("all");
      return next;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || isLoading) return;
    if (mode === "selected" && selectedSessionIds.length === 0) {
      setError("Select at least one session first.");
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setDraft("");
    setError(null);
    setIsLoading(true);
    setMessages((prev) => [...prev, userMsg]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const history = messages
        .filter((m) => m.id !== WELCOME_ID)
        .map(({ role, content }) => ({ role, content }));

      const { answer, sources } = await chatWithSessions(
        text,
        history,
        mode === "all" ? [] : selectedSessionIds,
      );

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          createdAt: Date.now(),
          sources,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const canSend =
    draft.trim().length > 0 && !isLoading && sortedSessions.length > 0;

  const containerHeight = "calc(100vh - 20rem)";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Chat with your Docs
        </h1>
        <p className="mt-2 text-gray-700 text-xl font-medium">
          Ask questions across all your sessions
        </p>
      </div>

      {/* One unified card */}
      <div
        className="bg-white border-2 border-gray-200 rounded-[14px] overflow-hidden flex"
        style={{ height: containerHeight }}
      >
        {/* ── Left column: Documents ── */}
        <div className="w-[240px] shrink-0 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="px-4 pt-3 pb-2.5 border-b border-gray-100 shrink-0">
            <span className="text-sm font-bold text-gray-600 tracking-wider">
              Documents
            </span>
          </div>

          {/* Session filter chips */}
          {sortedSessions.length > 0 && (
            <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("all");
                    setSelectedSessionIds([]);
                    setError(null);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-[10px] text-xs font-semibold transition-colors",
                    mode === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  All
                </button>
                {sortedSessions.map((session) => {
                  const active =
                    mode === "selected" &&
                    selectedSessionIds.includes(session.id);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => toggleSession(session.id)}
                      className={cn(
                        "max-w-[140px] truncate px-2.5 py-1 rounded-[10px] text-xs font-semibold transition-colors",
                        active
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                      )}
                      title={session.title}
                    >
                      {session.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document list */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {loading || docsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : docs.length > 0 ? (
              <div className="space-y-1">
                {docs.map((doc) => {
                  const lastDot = doc.name.lastIndexOf(".");
                  const fileName =
                    lastDot > -1 ? doc.name.substring(0, lastDot) : doc.name;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <span className="text-xs font-semibold text-gray-700 truncate flex-1">
                        {fileName}{" "}
                        <span className="font-normal text-gray-400">
                          • {doc.size}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageSquareText className="w-7 h-7 text-gray-300 mb-3" />
                <p className="text-xs font-medium text-gray-500">
                  No documents
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload files to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Chat ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Messages */}
          <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-5">
              {messages.map((message) =>
                message.role === "user" ? (
                  /* User bubble — right-aligned, border only */
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[70%] rounded-[14px] border-2 border-gray-300 px-4 py-2.5">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-6">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Assistant — plain text, no bubble */
                  <div key={message.id} className="max-w-[85%]">
                    <ChatMarkdown content={message.content} />
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {message.sources.map((source) => (
                          <span
                            key={`${message.id}-${source.documentId}`}
                            className="font-mono text-[11px] text-gray-400"
                          >
                            sourced from {source.documentName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              )}

              {!loading && sortedSessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquareText className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="font-medium text-gray-700 text-sm">
                    No session content yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload documents first, then come back here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Input area pinned to bottom */}
          <div className="border-t border-gray-100 px-4 py-3 shrink-0">
            <form onSubmit={handleSubmit}>
              <div className="rounded-[14px] border-2 border-gray-200 bg-gray-50 px-4 py-3">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    sortedSessions.length === 0
                      ? "Upload documents to start chatting..."
                      : "Focus your learning — describe what topics or concepts to emphasize..."
                  }
                  rows={2}
                  disabled={sortedSessions.length === 0 || isLoading}
                  className="w-full resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50 leading-6"
                  style={{ maxHeight: 120 }}
                />
                <div className="flex items-center justify-between mt-2">
                  {error ? (
                    <p className="text-xs text-red-600">{error}</p>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {mode === "all"
                        ? `All ${sortedSessions.length} session${sortedSessions.length === 1 ? "" : "s"}`
                        : `${selectedSessionIds.length} session${selectedSessionIds.length === 1 ? "" : "s"} selected`}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      canSend
                        ? "text-gray-900 hover:text-gray-600"
                        : "text-gray-400 cursor-not-allowed",
                    )}
                  >
                    Send →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
