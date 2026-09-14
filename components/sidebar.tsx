"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Icon } from "@/components/icons";
import { Button, Tip, buttonVariants, cn } from "@/components/ui";
import { useApp } from "@/contexts/app";
import * as db from "@/lib/db";
import type { Session } from "@/types";

// Formats a timestamp as "3h ago".
export function ago(time: number) {
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ago`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ago`;
  return minutes > 0 ? `${minutes}m ago` : "just now";
}

// Delete button with a confirmation dialog.
function Remove({ session }: { session: Session }) {
  const router = useRouter();
  const { current, reset, load } = useApp();

  // Deletes the session and everything saved under it.
  const remove = async () => {
    await db.drop(session.id);
    if (current?.id === session.id) {
      reset();
      router.push("/upload");
    }
    await load();
  };

  return (
    <AlertDialog.Root>
      <Tip label="Delete session">
        <AlertDialog.Trigger
          aria-label={`Delete ${session.title}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "absolute top-3 right-1.5 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
          )}
        >
          <Icon name="trash-2" />
        </AlertDialog.Trigger>
      </Tip>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/10 transition-opacity dark:bg-black/50 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-1/2 gap-4 rounded-xl border bg-background p-4 transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <AlertDialog.Title className="font-heading font-medium">Delete &ldquo;{session.title}&rdquo;?</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-muted-foreground">
            This removes the session and its saved notes, quizzes, and slides.
          </AlertDialog.Description>
          <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
            <AlertDialog.Close render={<Button variant="outline" />}>Cancel</AlertDialog.Close>
            <Button onClick={() => void remove()}>Delete</Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// Brand, new-session button and the session list; onPick runs after navigating.
export function Sessions({ onPick }: { onPick?: () => void }) {
  const { sessions, current, reset } = useApp();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center pr-2 pl-5">
        <Link href="/upload" onClick={() => { reset(); onPick?.(); }} className="rounded-md font-heading text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          ArcEdu
        </Link>
      </div>
      <div className="px-3">
        <Link href="/upload" onClick={() => { reset(); onPick?.(); }} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          <Icon name="plus" /> New session
        </Link>
      </div>
      <h2 className="px-5 pt-6 pb-2 text-xs font-medium text-muted-foreground">Sessions</h2>
      <nav aria-label="Sessions" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {sessions.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">Your study sessions will show up here.</p>
        ) : (
          <ul className="space-y-0.5">
            {sessions.map((session) => (
              <li key={session.id} className="group relative">
                <Link
                  href={`/sessions/${session.id}`}
                  onClick={onPick}
                  aria-current={current?.id === session.id ? "page" : undefined}
                  className="flex flex-col rounded-lg px-3 py-2 pr-10 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted"
                >
                  <span className="truncate font-medium">{session.title}</span>
                  <span className="text-xs text-muted-foreground">{ago(session.updatedAt)}</span>
                </Link>
                <Remove session={session} />
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}

// Desktop sidebar; collapses fully and smoothly, above the page wallpaper.
export function Sidebar() {
  const { side } = useApp();
  return (
    <aside
      inert={!side}
      aria-hidden={!side}
      className={cn("relative z-10 hidden shrink-0 overflow-hidden bg-background transition-[width] duration-300 ease-out motion-reduce:transition-none md:flex", side ? "w-64 border-r" : "w-0")}
    >
      <div className="flex w-64 shrink-0 flex-col">
        <Sessions />
      </div>
    </aside>
  );
}
