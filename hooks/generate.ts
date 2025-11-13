import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useContent } from "@/hooks/content";
import { useUpload } from "@/hooks/upload";
import type { Format, Quiz } from "@/types";
import { saveNotes, saveSlides } from "@/lib/storage/sessions";

export function useGenerate() {
    const state = useAppState();
    const { current, update } = useSession();
    const { generateQuizContent, generateNotesContent, generateSlidesContent } = useContent();
    const { getTopicText } = useUpload();

    const generate = async (format: Format, onNav: (route: string) => void) => {
        if (!current) {
            state.setError("No active session");
            return;
        }

        state.setSelectedFormat(format);
        state.setIsLoading(true);
        state.setError(null);

        try {
            const topicText = getTopicText(state.topic, state.uploadedDocs, state.links);

            if (format === "quiz") {
                state.quiz.startQuiz();
                let first = true;

                await generateQuizContent({
                    sessionId: current.id,
                    topic: topicText,
                    numQuestions: state.numQuestions,
                    difficulty: state.difficulty,
                    prompt: state.promptText.trim() || undefined,
                    timeLimit: state.timeLimit,
                    onProgress: (item) => {
                        state.quiz.setQuizData(prev => [...prev, item as Quiz]);
                        if (first) { onNav("/quiz"); first = false; }
                    },
                });
                await update(current.id, { lastFormat: "quiz" });
            } else if (format === "notes") {
                state.notes.startNotes();

                // Allow React batch cycle to clear strings from the screen globally
                await new Promise(r => setTimeout(r, 50));

                onNav("/notes");

                try {
                    const content = await generateNotesContent({
                        sessionId: current.id,
                        topic: topicText,
                        notesFormat: state.notesFormat,
                        notesLength: state.notesLength,
                        codeEnabled: state.codeEnabled,
                        formulasEnabled: state.formulasEnabled,
                        diagramsEnabled: state.diagramsEnabled,
                        tablesEnabled: state.tablesEnabled,
                        prompt: state.promptText.trim() || undefined,
                        onProgress: (text) => state.notes.setNotesContent(text),
                    });
                    state.notes.hydrateNotes(content);
                    await update(current.id, { lastFormat: "notes" });

                    await saveNotes({
                        id: crypto.randomUUID(),
                        sessionId: current.id,
                        title: `${topicText || "Untitled"} - Notes`,
                        content,
                        createdAt: Date.now(),
                    });
                } finally {
                    state.notes.finishNotes();
                }
            } else if (format === "slides") {
                state.slides.startSlides();

                // Allow React batch cycle to clear strings from the screen globally
                await new Promise(r => setTimeout(r, 50));

                onNav("/slides");

                try {
                    const content = await generateSlidesContent({
                        sessionId: current.id,
                        topic: topicText,
                        numSlides: state.numSlides,
                        slideDesign: state.slideDesign,
                        codeEnabled: state.codeEnabled,
                        formulasEnabled: state.formulasEnabled,
                        tablesEnabled: state.tablesEnabled,
                        prompt: state.promptText.trim() || undefined,
                        onProgress: (text) => state.slides.setSlidesContent(text),
                    });
                    state.slides.hydrateSlides(content, 0);
                    await update(current.id, { lastFormat: "slides" });

                    await saveSlides({
                        id: crypto.randomUUID(),
                        sessionId: current.id,
                        title: `${topicText || "Untitled"} - Slides`,
                        content,
                        createdAt: Date.now(),
                    });
                } finally {
                    state.slides.finishSlides();
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate content";
            if (message !== "Generation cancelled") {
                state.setError(message);
            }
        } finally {
            state.setIsLoading(false);
        }
    };

    return { generate };
}
