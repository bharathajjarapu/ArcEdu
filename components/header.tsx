"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { Icon } from "@/components/icons";
import { Button, Tip, buttonVariants, cn } from "@/components/ui";
import { Sessions } from "@/components/sidebar";
import { useApp } from "@/contexts/app";

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

// Top bar: opens the sidebar (a drawer on mobile), shows the brand while it is closed, and switches theme.
export function Header() {
  const [open, setOpen] = useState(false);
  const { side, setSide, reset } = useApp();

  return (
    <header className="flex h-14 shrink-0 items-center px-4 sm:px-6">
      <div className={cn("flex items-center gap-1", side && "md:hidden")}>
        <Tip label="Open sidebar">
          <Button variant="ghost" size="icon" aria-label="Open sidebar" aria-expanded={side} onClick={() => setSide(true)} className="-ml-2 max-md:hidden">
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
              <Sessions onClose={() => setOpen(false)} onPick={() => setOpen(false)} />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Link href="/upload" onClick={reset} className="rounded-md px-1 font-heading text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          ArcEdu
        </Link>
      </div>
      <Tip label="Switch theme">
        <Button variant="ghost" size="icon" aria-label="Switch theme" onClick={flip} className="-mr-2 ml-auto">
          <Icon name="moon" className="dark:hidden" />
          <Icon name="sun" className="hidden dark:block" />
        </Button>
      </Tip>
    </header>
  );
}
