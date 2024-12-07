"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Folder, Link, Trash2 } from "lucide-react";
import { getRelativeTime } from "@/lib/format";

interface SessionsProps {
  sessions: any[];
  onSelect: (session: any) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function Sessions({ sessions, onSelect, onDelete, onBack }: SessionsProps) {
  const completed = sessions.filter((s) => s.completed);

  return (
    <div className="max-w-7xl mx-auto py-10">
      {completed.length === 0 ? (
        <div className="text-center py-20">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <Button variant="ghost" size="sm" onClick={onBack} className="border border-gray-200 rounded-lg mt-5"> <Link className="w-4 h-4 mr-1" /> Go Back</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {completed.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelect(session)}
              className="group cursor-pointer relative bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
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
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
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

