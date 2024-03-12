"use client";

import { FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  size: string;
  onRemove?: () => void;
}

export function DocumentCard({ name, size, onRemove }: Props) {
  return (
    <Card className="p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-500" />
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-gray-500">{size}</p>
        </div>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
}
