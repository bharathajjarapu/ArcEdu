import { useCallback } from "react";
import {
    clearSessionStorageKey,
    useSessionStorageState,
} from "@/lib/storage";

export function useNotes() {
    const [notesContent, setNotesContent] = useSessionStorageState("notes-content", "");
    const [isGenerating, setIsGenerating] = useSessionStorageState("notes-generating", false);
    const [startTime, setStartTime] = useSessionStorageState("notes-start-time", 0);

    const startNotes = useCallback(() => {
        setNotesContent("");
        setIsGenerating(true);
        setStartTime(Date.now());
    }, []);

    const finishNotes = useCallback(() => {
        setIsGenerating(false);
    }, []);

    const hydrateNotes = useCallback((content: string) => {
        setNotesContent(content);
        setIsGenerating(false);
    }, [setNotesContent, setIsGenerating]);

    const clearNotes = useCallback(() => {
        setNotesContent("");
        setIsGenerating(false);
        setStartTime(0);
        clearSessionStorageKey("notes-content");
        clearSessionStorageKey("notes-generating");
        clearSessionStorageKey("notes-start-time");
    }, [setNotesContent, setIsGenerating, setStartTime]);

    return { notesContent, setNotesContent, isGenerating, startTime, startNotes, finishNotes, hydrateNotes, clearNotes };
}
