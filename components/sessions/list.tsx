"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionCard } from "./card";
import type { Session } from "@/types";

interface Props {
  sessions: Session[];
  loading: boolean;
  onSelect: (session: Session) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function SessionList({ sessions, loading, onSelect, onDelete, onCreate }: Props) {
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Sessions</h1>
          <p className="text-gray-600">Organize your study materials by topic</p>
        </div>
        <Button onClick={onCreate} className="bg-gray-900 hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Create your first learning session to get started</p>
          <Button onClick={onCreate} className="bg-gray-900 hover:bg-gray-800">
            Create Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => onSelect(session)}
              onDelete={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
