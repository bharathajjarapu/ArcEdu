"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Trash2,
  Loader2,
  UploadIcon,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { generateTitle } from "@/lib/api/client";
import { parse } from "@/lib/parse";
import * as docs from "@/lib/storage/docs";
import * as queue from "@/lib/process/queue";
import * as worker from "@/lib/process/worker";
import { simple as simpleHash } from "@/lib/data/hash";
import type { Chunk } from "@/types";

interface UploadProps {
  uploadedDocs: Array<{ id: string; name: string; size: string }>;
  setUploadedDocsAction: (
    docs: Array<{ id: string; name: string; size: string }>,
  ) => void;
  error: string | null;
  setErrorAction: (error: string | null) => void;
  isLoading: boolean;
  setIsLoadingAction: (loading: boolean) => void;
  activeSessionId: string | null;
  onCreateAction: (title: string) => Promise<any>;
  onUpdateSessionAction: (id: string, data: { title: string }) => Promise<void>;
  onContinueAction: () => void;
  all: any[];
  onSessionsClick: () => void;
}

export function Upload({
  uploadedDocs,
  setUploadedDocsAction,
  error,
  setErrorAction,
  isLoading,
  setIsLoadingAction,
  activeSessionId,
  onCreateAction,
  onUpdateSessionAction,
  onContinueAction,
  all,
  onSessionsClick,
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
            content = await parse(file);
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

  const handleRemoveDoc = (docId: string) => {
    setUploadedDocsAction(uploadedDocs.filter((d) => d.id !== docId));
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl py-12">
        <div className="text-center mb-12">
          <h1 className="text-8xl font-bold tracking-tight text-gray-900 mb-9">
             Ready to Quiz
            <br />
            anything ?
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Drop your Docs here
            <br />
            We'll handle your Learning !
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="bg-white border-gray-200 rounded-xl overflow-hidden">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl py-25 px-10 text-center bg-gray-100 hover:bg-gray-300/40 hover:border-gray-400 transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-gray-400", "bg-gray-50");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-gray-400", "bg-gray-50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-gray-400", "bg-gray-50");
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const input = document.getElementById("file-upload") as HTMLInputElement;
                const dataTransfer = new DataTransfer();
                Array.from(files).forEach((file) => dataTransfer.items.add(file));
                input.files = dataTransfer.files;
                input.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }}
          >
            <UploadIcon className="w-6 h-6 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">Drag & drop your file</p>
            <p className="text-sm text-gray-500">
              or{" "}
              <button
                onClick={() => document.getElementById("file-upload")?.click()}
                className="px-1 underline text-gray-900 hover:text-gray-700"
              >
                browse files
              </button>
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
          </div>
        </Card>

        {/* Uploaded Files */}
        {uploadedDocs.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
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

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Start Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={onContinueAction}
            disabled={isLoading}
            className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 text-base font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Let's Start
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* My Sessions Button */}
        {all.filter((s) => s.completed).length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              onClick={onSessionsClick}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              My Sessions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
