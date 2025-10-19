"use client";

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Sun, Home, FolderOpen, MessageSquareText } from "lucide-react";
import { useSession } from "@/contexts/session";
import { useAppState } from "@/contexts/state";
import * as worker from "@/lib/process/worker";

const baseNavItems = [
    { label: "Home", href: "/upload", icon: Home },
    { label: "Sessions", href: "/sessions", icon: FolderOpen },
    { label: "Chat", href: "/chat", icon: MessageSquareText },
];

const sessionPages = ["/format", "/quiz", "/notes", "/slides", "/results"];

function isSessionRoute(pathname: string) {
    return pathname === "/sessions"
        || pathname.startsWith("/sessions/")
        || sessionPages.some((page) => pathname.startsWith(page));
}

function getNavItems(pathname: string) {
    return baseNavItems.map((item) => {
        if (item.href !== "/sessions") return item;
        return {
            ...item,
            label: isSessionRoute(pathname) ? "Session" : item.label,
        };
    });
}

function getVisibleNav(pathname: string) {
    const items = getNavItems(pathname);
    if (sessionPages.some((p) => pathname.startsWith(p))) {
        return items.filter((item) => item.label !== "Chat");
    }
    return items;
}

function getActiveIndex(pathname: string, items: ReturnType<typeof getNavItems>) {
    const idx = items.findIndex((item) => {
        if (item.href === "/sessions") return isSessionRoute(pathname);
        if (item.label === "Home") return pathname === "/" || pathname === "/upload";
        if (item.label === "Chat") return pathname.startsWith("/chat");
        return false;
    });
    return idx >= 0 ? idx : 0;
}

export function Frame({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { current, update, setCurrent, refresh } = useSession();
    const state = useAppState();

    const visibleNav = getVisibleNav(pathname);
    const [activeIdx, setActiveIdx] = useState(() => getActiveIndex(pathname, visibleNav));
    const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
    const navRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const updateIndicator = useCallback(() => {
        const el = itemRefs.current[activeIdx];
        if (el && navRef.current) {
            const navRect = navRef.current.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            setIndicatorStyle({
                left: elRect.left - navRect.left,
                width: elRect.width,
            });
        }
    }, [activeIdx]);

    useEffect(() => {
        worker.initWorkers();
        return () => worker.terminate();
    }, []);

    useEffect(() => {
        setActiveIdx(getActiveIndex(pathname, visibleNav));
    }, [pathname, visibleNav]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(updateIndicator);
        window.addEventListener("resize", updateIndicator);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", updateIndicator);
        };
    }, [pathname, updateIndicator]);

    const showNewSession = pathname !== "/upload" && pathname !== "/sessions" && pathname !== "/" && !pathname.startsWith("/chat");

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

    const handleNav = (idx: number, href: string) => {
        setActiveIdx(idx);

        if (href === "/upload" && pathname !== "/upload" && pathname !== "/") {
            handleNewSession();
            return;
        }

        router.push(href);
    };

    return (
        <div className="h-screen bg-gray-50 bg-dots flex flex-col overflow-hidden">
            {/* Top bar with branding + nav + theme toggle */}
            <header className="fixed top-0 left-0 right-0 z-50 px-5 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Left — Brand */}
                    <button
                        onClick={handleNewSession}
                        className="text-lg font-semibold tracking-tight text-gray-900 select-none cursor-pointer"
                    >
                        ArcEdu
                    </button>

                    {/* Center — Floating Nav */}
                    <nav
                        ref={navRef}
                        className="relative inline-block rounded-[calc(var(--radius)+2px)] border border-border/70 bg-card/70 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                    >
                        <div
                            className="pointer-events-none absolute top-1 bottom-1 rounded-[calc(var(--radius)+2px)] bg-primary"
                            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                        />
                        <div className="relative z-10 flex items-center">
                            {visibleNav.map((item, idx) => (
                                <button
                                    key={item.label}
                                    ref={(el) => { itemRefs.current[idx] = el; }}
                                    onClick={() => handleNav(idx, item.href)}
                                    className={`relative z-10 flex items-center gap-1.5 rounded-[calc(var(--radius)+2px)] px-5 py-2.5 text-[13px] font-medium cursor-pointer ${activeIdx === idx
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <item.icon className="h-3.5 w-3.5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Right — New Session + Theme toggle */}
                    <div className="flex items-center gap-2">
                        {showNewSession && (
                            <button
                                onClick={handleNewSession}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-[calc(var(--radius)+2px)] border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 text-[13px] font-medium transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Session
                            </button>
                        )}
                        <button
                            className="p-2 rounded-[calc(var(--radius)+2px)] border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            <Sun className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-24" />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="min-h-full flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>

                    <footer className="py-3 shrink-0">
                        <p className="text-center text-sm text-gray-600">
                            Built with NextJS, React, TypeScript & TailwindCSS
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
