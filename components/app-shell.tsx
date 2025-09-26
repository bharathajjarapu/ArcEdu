"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/session";
import { useAppState } from "@/contexts/state";
import * as worker from "@/lib/process/worker";

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { current, update, setCurrent, refresh } = useSession();
    const state = useAppState();

    useEffect(() => {
        worker.initWorkers();
        return () => worker.terminate();
    }, []);

    const showNewSession = pathname !== "/upload" && pathname !== "/sessions" && pathname !== "/";

    const handleNewSession = async () => {
        if (current) {
            await update(current.id, { completed: true });
        }
        setCurrent(null);
        state.reset();
        await refresh();
        router.push("/upload");
    };

    return (
        <div className="min-h-screen bg-gray-50 bg-dots">
            <header className="px-4 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold tracking-tight text-gray-900">ArcEdu</span>
                    </div>
                    {showNewSession && (
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={handleNewSession} className="border border-gray-200 rounded-lg">
                                <Plus className="w-4 h-4 mr-1" />
                                New Session
                            </Button>
                        </div>
                    )}
                </div>
            </header>
            {children}
        </div>
    );
}
