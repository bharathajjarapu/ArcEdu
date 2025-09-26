"use client";

import { Sessions } from "@/components/screens/sessions";
import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useRouter } from "next/navigation";
import * as sessions from "@/lib/storage/sessions";

export default function SessionsPage() {
    const router = useRouter();
    const state = useAppState();
    const { all, setCurrent, remove, refresh } = useSession();

    const handleSelectSession = async (session: { id: string; title: string }) => {
        state.setIsLoading(true);
        try {
            setCurrent(session as any);
            const docsData = await sessions.getDocs(session.id);
            state.setUploadedDocs(docsData.map((d) => ({ id: d.id, name: d.name, size: d.size })));
            if (docsData.length > 0) {
                state.setTopic(docsData.map((d) => d.name).join(", "));
            }
            router.push("/format");
        } catch {
            state.setError("Failed to load session");
        } finally {
            state.setIsLoading(false);
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (confirm("Delete this session?")) {
            await remove(id);
            refresh();
        }
    };

    return (
        <Sessions
            sessions={all}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
            onBack={() => router.push("/upload")}
        />
    );
}
