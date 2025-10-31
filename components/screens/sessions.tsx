"use client";

import { Folder, Trash2 } from "lucide-react";
import { getRelativeTime } from "@/lib/format";

interface SessionsProps {
  sessions: any[];
  onSelect: (session: any) => void;
  onDelete: (id: string) => void;
}

export function Sessions({
  sessions,
  onSelect,
  onDelete,
}: SessionsProps) {
  const completed = sessions.slice().reverse();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      {completed.length === 0 ? (
        <div className="text-center py-20">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No sessions yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {completed.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(session)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(session);
                }
              }}
              aria-label={`Open session ${session.title}`}
              className="group cursor-pointer relative bg-white border border-gray-200 rounded-[calc(var(--radius)+2px)] p-5 hover:border-gray-300 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-[calc(var(--radius)+2px)] flex items-center justify-center mb-4"
                style={{ backgroundColor: session.color || "#f3f4f6" }}
              >
                <Folder className="w-6 h-6 text-gray-700" />
              </div>

              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {session.title}
              </h3>

              <p className="text-sm text-gray-500">
                {getRelativeTime(new Date(session.updatedAt))}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                aria-label={`Delete session ${session.title}`}
                className="absolute top-3 right-3 p-1.5 rounded-[calc(var(--radius)+2px)] text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

