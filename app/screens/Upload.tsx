"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  Plus,
  X,
  FileText,
  Trash2,
  Loader2,
  Folder,
  UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputType } from "@/types";
import { uploadPDF, generateTitle } from "@/lib/api";
import * as docs from "@/lib/storage/docs";
import * as queue from "@/lib/process/queue";
import * as worker from "@/lib/process/worker";
import { simple as simpleHash } from "@/lib/data/hash";
import type { Chunk } from "@/types";
import { getRelativeTime } from "@/lib/helpers";

interface UploadProps {
  inputType: InputType;
  setInputTypeAction: (type: InputType) => void;
  promptText: string;
  setPromptTextAction: (text: string) => void;
  uploadedDocs: Array<{ id: string; name: string; size: string }>;
  setUploadedDocsAction: (
    docs: Array<{ id: string; name: string; size: string }>,
  ) => void;
  links: string[];
  setLinksAction: (links: string[]) => void;
  currentLink: string;
  setCurrentLinkAction: (link: string) => void;
  error: string | null;
  setErrorAction: (error: string | null) => void;
  isLoading: boolean;
  setIsLoadingAction: (loading: boolean) => void;
  activeSessionId: string | null;
  onCreateAction: (title: string) => Promise<any>;
  onUpdateSessionAction: (id: string, data: { title: string }) => Promise<void>;
  onContinueAction: () => void;
  all: any[];
  onSelectSessionAction: (session: any) => void;
  onDeleteSessionAction: (id: string) => void;
}

export function Upload({
  inputType,
  setInputTypeAction,
  promptText,
  setPromptTextAction,
  uploadedDocs,
  setUploadedDocsAction,
  links,
  setLinksAction,
  currentLink,
  setCurrentLinkAction,
  error,
  setErrorAction,
  isLoading,
  setIsLoadingAction,
  activeSessionId,
  onCreateAction,
  onUpdateSessionAction,
  onContinueAction,
  all,
  onSelectSessionAction,
  onDeleteSessionAction,
}: UploadProps) {
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoadingAction(true);
    try {
      let sessionId = activeSessionId;

      if (!sessionId) {
        const session = await onCreateAction("New Session");
        sessionId = session.id;
      }

      const fileNames: string[] = [];
      const pdfQueue = queue.create(3);
      const newDocs = await pdfQueue.all(
        Array.from(files).map((file) => async () => {
          fileNames.push(file.name);
          let content = "";
          try {
            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
              const pdfData = await uploadPDF(file);
              content = pdfData.text;
            } else if (
              file.type.startsWith("text/") ||
              file.name.endsWith(".txt")
            ) {
              content = await file.text();
            }
          } catch (err) {
            console.error("Error processing file:", err);
          }

          const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

          if (sessionId && content) {
            try {
              const doc = await docs.create(
                sessionId,
                file.name,
                size,
                content,
              );

              const textChunks = await worker.chunkText(content);
              const chunks: Chunk[] = textChunks.map((text, index) => ({
                id: crypto.randomUUID(),
                sessionId: sessionId!,
                documentId: doc.id,
                text,
                embedding: [],
                index,
                hash: simpleHash(text),
              }));

              if (chunks.length > 0) {
                for (const chunk of chunks) {
                  await docs.saveChunks([chunk]);
                }
              }
            } catch (err) {
              console.error("Error saving document:", err);
            }
          }

          return {
            id: crypto.randomUUID(),
            name: file.name,
            size,
          };
        }),
      );

      setUploadedDocsAction([...uploadedDocs, ...newDocs]);

      if (sessionId && fileNames.length > 0) {
        const content = fileNames.join(", ");
        const title = await generateTitle(content);
        if (title && title !== "New Session") {
          await onUpdateSessionAction(sessionId, { title });
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorAction("Failed to upload files");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const addLink = () => {
    if (currentLink.trim()) {
      setLinksAction([...links, currentLink.trim()]);
      setCurrentLinkAction("");
    }
  };

  const removeLink = (index: number) => {
    setLinksAction(links.filter((_, i) => i !== index));
  };

  const handleRemoveDoc = (docId: string) => {
    setUploadedDocsAction(uploadedDocs.filter((d) => d.id !== docId));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Quiz Yourself</h1>
        <p className="text-gray-600 mb-8">
          Upload a PDF, slides, or paste a URL.
          <br />
          We'll handle the questions!
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-white/80 backdrop-blur-sm p-1 rounded-lg flex border border-gray-200">
          <button
            onClick={() => setInputTypeAction("prompt")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              inputType === "prompt"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            Prompt
          </button>
          <button
            onClick={() => setInputTypeAction("docs")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              inputType === "docs"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            Docs
          </button>
          <button
            onClick={() => setInputTypeAction("links")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              inputType === "links"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            Links
          </button>
        </div>
      </div>

      {inputType === "prompt" && (
        <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm border-gray-200">
          <textarea
            placeholder="Enter your prompt here..."
            value={promptText}
            onChange={(e) => setPromptTextAction(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
          />
        </Card>
      )}

      {inputType === "docs" && (
        <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm border-gray-200">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 mb-6">
            <UploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag & drop your files</p>
            <p className="text-sm text-gray-500 mb-4">or browse files</p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={isLoading}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Browse Files"
              )}
            </Button>
          </div>

          {uploadedDocs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Uploaded Documents:
              </h4>
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {inputType === "links" && (
        <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm border-gray-200">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              You can use YouTube Links and Doc Links
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={currentLink}
                onChange={(e) => setCurrentLinkAction(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addLink()}
                className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
              <Button
                onClick={addLink}
                disabled={!currentLink.trim()}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {links.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Added Links:
              </h4>
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-sm text-gray-900 truncate flex-1 mr-3">
                    {link}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="text-center mb-16">
        <Button
          onClick={onContinueAction}
          disabled={isLoading}
          className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3"
        >
          <ChevronRight className="w-4 h-4 mr-2" />
          Continue
        </Button>
      </div>

      {all.filter((s) => s.completed).length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Past Learning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {all
              .filter((s) => s.completed)
              .map((session) => (
                <Card
                  key={session.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all border-gray-200 bg-white/90"
                  onClick={() => onSelectSessionAction(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: session.color || "#e5e7eb",
                        }}
                      >
                        <Folder className="w-5 h-5 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {session.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {getRelativeTime(new Date(session.updatedAt))}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSessionAction(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-gray-400" />
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
