"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, color: string) => void;
}

const colors = [
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#a7f3d0",
  "#7dd3fc",
  "#c4b5fd",
  "#f9a8d4",
  "#e5e7eb",
];

export function CreateModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(colors[0]);

  if (!open) return null;

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title, color);
    setTitle("");
    setColor(colors[0]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">New Session</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title
            </label>
            <Input
              placeholder="e.g. Data Structures & Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c ? "ring-2 ring-gray-900 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="flex-1 bg-gray-900 hover:bg-gray-800"
          >
            Create
          </Button>
        </div>
      </Card>
    </div>
  );
}
