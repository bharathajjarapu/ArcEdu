"use client";

import { useRef } from "react";
import { FileText, Plus, X } from "lucide-react";

interface SessionDocument {
  id: string;
  name: string;
  size: string;
}

interface SessionDocumentsProps {
  documents: SessionDocument[];
  sessionTitle: string;
  onAddDocs: (files: File[]) => Promise<void>;
  onRemoveDoc: (docId: string) => Promise<void>;
}

export function SessionDocuments({
  documents,
  sessionTitle,
  onAddDocs,
  onRemoveDoc,
}: SessionDocumentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-[calc(var(--radius)+2px)] border border-gray-200 text-sm text-gray-700"
          >
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span className="max-w-[120px] truncate">{doc.name}</span>
            <button
              onClick={() => void onRemoveDoc(doc.id)}
              aria-label={`Remove ${doc.name}`}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <button
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          aria-label={`Add documents to ${sessionTitle}`}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)+2px)] border border-dashed border-gray-300 bg-white text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Docs
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            void onAddDocs(Array.from(files));
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
