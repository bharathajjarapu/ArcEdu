"use client";

import { Icon } from "@/components/icons";
import { Badge, Button } from "@/components/ui";
import { useApp } from "@/contexts/app";
import * as db from "@/lib/db";

export const accept = ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp,.rtf,.epub,.csv,.txt,.md";

// The active session's documents as removable chips.
export function Docs() {
  const { docs, load } = useApp();
  if (docs.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {docs.map((doc) => (
        <li key={doc.id}>
          <Badge className="h-8 pr-1 pl-3 text-sm">
            <Icon name="file-text" className="text-muted-foreground" />
            <span className="max-w-40 truncate">{doc.name}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => void db.remove("documents", doc.id).then(() => load())}
              aria-label={`Remove ${doc.name}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name="x" />
            </Button>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
