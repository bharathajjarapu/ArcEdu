import { useState, useCallback } from "react";

export function useNotes() {
    const [notesContent, setNotesContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [startTime, setStartTime] = useState(0);

    const startNotes = useCallback(() => {
        setNotesContent("");
        setIsGenerating(true);
        setStartTime(Date.now());
    }, []);

    const finishNotes = useCallback(() => {
        setIsGenerating(false);
    }, []);

    return { notesContent, setNotesContent, isGenerating, startTime, startNotes, finishNotes };
}
