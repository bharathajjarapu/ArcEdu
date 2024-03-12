"use client";

import { useProgress } from "@/contexts/progress";
import { Loader2 } from "lucide-react";

interface Props {
  sessionId: string;
}

export function Progress({ sessionId }: Props) {
  const { get } = useProgress();
  const progress = get(sessionId);

  if (!progress) return null;

  const percent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 min-w-[300px]">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
        <span className="text-sm font-medium text-gray-900">
          {progress.type === "upload" && "Uploading"}
          {progress.type === "chunk" && "Chunking"}
          {progress.type === "embed" && "Embedding"}
          {progress.type === "generate" && "Generating"}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-gray-800 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">
          {progress.current} / {progress.total}
        </span>
        <span className="text-xs font-medium text-gray-900">
          {percent}%
        </span>
      </div>

      {progress.message && (
        <p className="text-xs text-gray-500 mt-2">{progress.message}</p>
      )}
    </div>
  );
}
