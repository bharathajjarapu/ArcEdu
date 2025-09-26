"use client";

import { NotesScreen } from "@/components/screens/notes";
import { useAppState } from "@/contexts/state";

export default function NotesPage() {
    const state = useAppState();

    return (
        <NotesScreen
            content={state.notes.notesContent}
            isGenerating={state.notes.isGenerating}
            onEnd={state.notes.finishNotes}
        />
    );
}
