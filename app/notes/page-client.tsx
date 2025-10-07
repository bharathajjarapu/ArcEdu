"use client";

import { NotesScreen } from "@/components/screens/notes";
import { useAppState } from "@/contexts/state";
import { useRouter } from "next/navigation";

type NotesPageClientProps = {
    sessionId?: string;
};

export default function NotesPageClient({ sessionId }: NotesPageClientProps) {
    const state = useAppState();
    const router = useRouter();
    const { notesContent, isGenerating, finishNotes } = state.notes;
    const backHref = sessionId ? `/sessions/${sessionId}` : "/format";

    return (
        <NotesScreen
            content={notesContent}
            isGenerating={isGenerating}
            error={state.error}
            onEnd={finishNotes}
            onBackAction={() => router.push(backHref)}
        />
    );
}
