"use client";

import { Icon, Spinner } from "@/components/icons";
import { Badge, Button } from "@/components/ui";
import { useApp } from "@/contexts/app";
import * as db from "@/lib/db";

export const accept = ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp,.rtf,.epub,.csv,.txt,.md";

// A file icon with a line scanning down it while the document is read.
export function Reading({ name }: { name: string }) {
  return (
    <li className="group relative flex w-20 flex-col items-center gap-1">
      <span className="relative overflow-hidden">
        <Icon name="file" strokeWidth="1.25" className="size-11 text-muted-foreground/50" />
        <span className="animate-scan absolute inset-x-1 h-px bg-foreground/40" />
      </span>
      <span className="w-full truncate text-center text-xs text-muted-foreground">{name.replace(/\.[^.]+$/, "")}</span>
    </li>
  );
}

// The active session's documents, with files still being read and search indexing shown inline.
export function Docs() {
  const { docs, load, pending, indexing } = useApp();
  if (docs.length === 0 && pending.length === 0 && !indexing) return null;

  return (
    <div className="flex flex-col gap-3">
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
      {pending.length > 0 && (
        <ul aria-label="Reading files" className="flex flex-wrap gap-x-2 gap-y-3">
          {pending.map((name, index) => <Reading key={`${name}-${index}`} name={name} />)}
        </ul>
      )}
      {indexing && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" /> Embedding for search
        </p>
      )}
    </div>
  );
}
