"use client";

import { ChevronLeft, Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Session, Document } from "@/types";

interface Props {
  session: Session;
  documents: Document[];
  onBack: () => void;
  onAddDocs: () => void;
  onGenerate: (format: "quiz" | "flashcards") => void;
  onDeleteDoc: (id: string) => void;
}

export function SessionDetail({
  session,
  documents,
  onBack,
  onAddDocs,
  onGenerate,
  onDeleteDoc,
}: Props) {
  const date = new Date(session.updatedAt);
  const relative = getRelativeTime(date);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 hover:bg-gray-100"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Sessions
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: session.color || "#e5e7eb" }}
          >
            <FileText className="w-8 h-8 text-gray-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600">
              {documents.length} docs • Updated {relative}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Button
          onClick={() => onGenerate("quiz")}
          disabled={documents.length === 0}
          className="h-24 text-lg bg-gray-900 hover:bg-gray-800"
        >
          Generate Quiz
        </Button>
        <Button
          onClick={() => onGenerate("flashcards")}
          disabled={documents.length === 0}
          className="h-24 text-lg bg-gray-900 hover:bg-gray-800"
        >
          Generate Flashcards
        </Button>
      </div>

      <Card className="p-6 bg-white/90 backdrop-blur-sm border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          <Button onClick={onAddDocs} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Docs
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No documents yet</p>
            <Button onClick={onAddDocs} variant="outline">
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.size}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteDoc(doc.id)}
                  className="hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
