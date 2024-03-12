"use client";

import { Folder, Trash2, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Session } from "@/types";

interface Props {
  session: Session;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function SessionCard({ session, onClick, onDelete }: Props) {
  const date = new Date(session.updatedAt);
  const relative = getRelativeTime(date);

  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg transition-all border-gray-200 bg-white/90 backdrop-blur-sm"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: session.color || "#e5e7eb" }}
        >
          <Folder className="w-6 h-6 text-gray-700" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
        </Button>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
        {session.title}
      </h3>
      <p className="text-sm text-gray-500">Updated {relative}</p>
    </Card>
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
