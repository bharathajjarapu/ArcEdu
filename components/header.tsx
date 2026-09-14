"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Icon, Spinner } from "@/components/icons";
import { Button, Tip, buttonVariants, cn } from "@/components/ui";
import { Sessions } from "@/components/sidebar";
import { useApp } from "@/contexts/app";
import { download } from "@/lib/markdown";

const pages = ["/format", "/notes", "/quiz", "/slides", "/results"];

// Flips light and dark, saving the choice; cross-fades where view transitions exist.
function flip() {
  const root = document.documentElement;
  const apply = () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.theme = root.dataset.theme;
    } catch {}
  };
  if (document.startViewTransition) document.startViewTransition(apply);
  else apply();
}

// Note actions, hoisted into the bar so the page keeps its vertical space.
function Actions() {
  const { notes, busy, stop } = useApp();
  const title = notes.match(/^#\s+(.+)/m)?.[1] ?? "Notes";

  return (
    <>
      <span role="status" className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        {busy ? <><Spinner /> Writing notes…</> : notes ? `${notes.split(/\s+/).length.toLocaleString()} words` : ""}
      </span>
      <Tip label="Regenerate">
        <Link href="/format" aria-label="Regenerate notes" className={buttonVariants({ variant: "outline", size: "icon" })}>
          <Icon name="refresh-cw" />
        </Link>
      </Tip>
      {busy ? (
        <Button variant="outline" onClick={stop}>
          <Icon name="x" /> Stop
        </Button>
      ) : (
        <Button disabled={!notes} onClick={() => download(`${title}.md`, notes)}>
          <Icon name="download" /> Download
        </Button>
      )}
    </>
  );
}

// Top bar: sidebar toggle, back, per-screen actions and the theme switch.
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const { side, setSide, current } = useApp();

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 px-4 sm:px-6">
      <Tip label={side ? "Close sidebar" : "Open sidebar"}>
        <Button variant="ghost" size="icon" aria-label={side ? "Close sidebar" : "Open sidebar"} aria-expanded={side} onClick={() => setSide(!side)} className="-ml-2 max-md:hidden">
          <Icon name="panel-left" />
        </Button>
      </Tip>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger aria-label="Open sessions" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-ml-2 md:hidden")}>
          <Icon name="panel-left" />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/10 transition-opacity dark:bg-black/50 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-background transition-transform duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
            <Dialog.Title className="sr-only">Sessions</Dialog.Title>
            <Sessions onPick={() => setOpen(false)} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {pages.includes(path) && (
        <Tip label="Back">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => router.push(current ? `/sessions/${current.id}` : "/upload")} className="text-muted-foreground hover:text-foreground">
            <Icon name="arrow-left" />
          </Button>
        </Tip>
      )}
      <div className="ml-auto flex items-center gap-2">
        {path === "/notes" && <Actions />}
        <Tip label="Switch theme">
          <Button variant="ghost" size="icon" aria-label="Switch theme" onClick={flip} className="-mr-2">
            <Icon name="moon" className="dark:hidden" />
            <Icon name="sun" className="hidden dark:block" />
          </Button>
        </Tip>
      </div>
    </header>
  );
}
