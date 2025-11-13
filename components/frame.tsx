"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Upload, FolderOpen, MessageSquareText } from "lucide-react";
import { useSession } from "@/contexts/session";
import { useAppState } from "@/contexts/state";
import * as worker from "@/lib/process/worker";
import { cn } from "@/lib/utils";

const baseNavItems = [
    { label: "Upload", href: "/upload", icon: Upload },
    { label: "Sessions", href: "/sessions", icon: FolderOpen },
    { label: "Chat", href: "/chat", icon: MessageSquareText },
];

const sessionPages = ["/format", "/quiz", "/notes", "/slides", "/results"];

function isSessionRoute(pathname: string) {
    return pathname === "/sessions"
        || pathname.startsWith("/sessions/")
        || sessionPages.some((page) => pathname.startsWith(page));
}

function isActiveRoute(pathname: string, href: string) {
    if (href === "/upload") return pathname === "/" || pathname === "/upload";
    if (href === "/sessions") return isSessionRoute(pathname);
    if (href === "/chat") return pathname.startsWith("/chat");
    return false;
}

export function Frame({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { current, update, setCurrent, refresh } = useSession();
    const state = useAppState();

    const navItems = baseNavItems;

    useEffect(() => {
        worker.initWorkers();
        return () => worker.terminate();
    }, []);

    const resetSessionInBackground = useCallback(() => {
        if (!current) return;

        void (async () => {
            await update(current.id, { completed: true });
            await refresh();
        })();
    }, [current, refresh, update]);

    const handleNewSession = () => {
        setCurrent(null);
        state.reset();
        router.push("/upload");
        resetSessionInBackground();
    };

    const handleNav = (href: string) => {
        if (href === "/upload" && pathname !== "/upload" && pathname !== "/") {
            handleNewSession();
            return;
        }

        router.push(href);
    };

    return (
        <div className="flex min-h-screen flex-col overflow-hidden bg-muted/35 bg-dots">
            <header className="fixed top-0 left-0 right-0 z-50 px-3 py-3 sm:px-5 sm:py-5">
                <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <button
                        onClick={handleNewSession}
                        className="min-h-11 rounded-[calc(var(--radius)+2px)] px-2 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background sm:text-lg"
                        aria-label="Start a new study session"
                    >
                        ArcEdu
                    </button>

                    <nav
                        aria-label="Primary navigation"
                        className="absolute left-1/2 hidden -translate-x-1/2 rounded-[calc(var(--radius)+2px)] border border-border/70 bg-background/80 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex md:items-center"
                    >
                        {navItems.map((item) => {
                            const isActive = isActiveRoute(pathname, item.href);
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => handleNav(item.href)}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "flex min-h-11 min-w-[8.5rem] items-center justify-center gap-2 rounded-[calc(var(--radius)+2px)] px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-background hover:text-foreground",
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <div className="h-20 sm:h-24 md:h-24" />

            <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                <div className="flex min-h-full flex-col">
                    <div className="flex-1">
                        {children}
                    </div>

                    <footer className="py-3 shrink-0">
                        <p className="text-center text-sm text-muted-foreground">
                            Built with Next.js, React, TypeScript, and Tailwind CSS
                        </p>
                    </footer>
                </div>
            </main>

            <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden" aria-label="Primary navigation">
                <div className="mx-auto grid max-w-md grid-cols-3 gap-2 rounded-[calc(var(--radius)+2px)] border border-border/70 bg-background/90 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                    {navItems.map((item) => {
                        const isActive = isActiveRoute(pathname, item.href);
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNav(item.href)}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex min-h-11 flex-col items-center justify-center gap-1 rounded-[calc(var(--radius)+2px)] px-2 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-background hover:text-foreground",
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
