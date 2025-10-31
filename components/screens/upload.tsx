"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, X, Loader2, UploadIcon, ArrowRight } from "lucide-react";
import { generateTitle } from "@/lib/api/client";
import { parse } from "@/lib/parse";
import * as docs from "@/lib/storage/docs";
import * as queue from "@/lib/process/queue";
import * as worker from "@/lib/process/worker";
import { simple as simpleHash } from "@/lib/data/hash";
import type { Chunk } from "@/types";

interface UploadProps {
  uploadedDocs: Array<{ id: string; name: string; size: string }>;
  setUploadedDocsAction: (docs: Array<{ id: string; name: string; size: string }>) => void;
  error: string | null;
  setErrorAction: (error: string | null) => void;
  isLoading: boolean;
  setIsLoadingAction: (loading: boolean) => void;
  activeSessionId: string | null;
  onCreateAction: (title: string) => Promise<any>;
  onUpdateSessionAction: (id: string, data: { title: string }) => Promise<void>;
  onContinueAction: () => void;
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
}: UploadProps) {
  const handleRemoveDoc = async (id: string) => {
    try {
      await docs.remove(id);
    } catch (err) {
      console.error("Error removing file:", err);
      setErrorAction("Failed to remove file");
      return;
    }

    setUploadedDocsAction(uploadedDocs.filter((doc) => doc.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoadingAction(true);
    setErrorAction(null);

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await onCreateAction("New Session");
        sessionId = session.id;
      }

      const fileNames: string[] = [];
      const pdfQueue = queue.create(2);

      const newDocs = await pdfQueue.all(
        Array.from(files).map((file) => async () => {
          fileNames.push(file.name);
          const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
          let storedId = crypto.randomUUID();

          try {
            const content = await parse(file);
            if (sessionId && content) {
              const doc = await docs.create(sessionId, file.name, size, content);
              storedId = doc.id;
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
              await docs.saveChunks(chunks);
            }
          } catch (err) {
            console.error("Error processing file:", err);
          }

          return { id: storedId, name: file.name, size };
        })
      );

      setUploadedDocsAction([...uploadedDocs, ...newDocs]);

      if (sessionId && fileNames.length > 0) {
        const title = await generateTitle(fileNames);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const input = document.getElementById("file-upload") as HTMLInputElement | null;
    if (!input) return;

    const dt = new DataTransfer();
    Array.from(files).forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <div className="px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl pt-6 pb-10 sm:pt-10 md:pt-16 md:pb-12">
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 mb-6 sm:mb-9">
            Ready to Quiz<br />anything ?
          </h1>
          <p className="text-gray-700 text-base sm:text-lg font-medium leading-relaxed">
            Drop your Docs here<br />We'll handle your Learning !
          </p>
        </div>

        <Card className="bg-white border-gray-200 rounded-[calc(var(--radius)+2px)] overflow-hidden">
          <div
            className={`border-2 border-dashed rounded-[calc(var(--radius)+2px)] min-h-[18rem] px-6 py-8 text-center flex flex-col items-center justify-center transition-colors sm:h-75 sm:px-10 ${error ? "border-red-300 bg-red-50/50" : "border-gray-300 bg-gray-100 hover:bg-gray-200/60 hover:border-gray-400"
              }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Processing...</span>
              </div>
            ) : (
              <>
                <UploadIcon className="w-6 h-6 text-gray-400 mb-3" />
                <p className="text-gray-700 font-medium mb-1">Drag & drop your file</p>
                <p className="text-sm text-gray-500">
                  or{" "}
                  <button
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="underline text-gray-900 hover:text-gray-700"
                  >
                    browse files
                  </button>
                </p>
                {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}
              </>
            )}
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

        {uploadedDocs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-[calc(var(--radius)+2px)] border border-gray-200 text-sm text-gray-700"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span className="max-w-[10rem] truncate sm:max-w-[140px]">{doc.name}</span>
                <button
                  onClick={() => void handleRemoveDoc(doc.id)}
                  aria-label={`Remove ${doc.name}`}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button
            onClick={onContinueAction}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 text-base font-medium shadow-md"
          >
            Let's Start
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>


      </div>
    </div>
  );
}
