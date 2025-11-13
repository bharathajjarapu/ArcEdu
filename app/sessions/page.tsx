"use client";

import { Sessions } from "@/components/screens/sessions";
import { useSession } from "@/contexts/session";
import { useRouter } from "next/navigation";

export default function SessionsPage() {
    const router = useRouter();
    const { all, remove, refresh } = useSession();

    const handleSelectSession = (session: { id: string; title: string }) => {
        router.push(`/sessions/${session.id}`);
    };

    const handleDeleteSession = async (id: string) => {
        if (confirm("Delete this session and its saved notes, quizzes, and slides?")) {
            await remove(id);
            refresh();
        }
    };

    return (
        <Sessions
            sessions={all}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
        />
    );
}
