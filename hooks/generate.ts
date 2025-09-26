import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useContent } from "@/hooks/content";
import { useUpload } from "@/hooks/upload";
import type { Format, Quiz } from "@/types";

export function useGenerate() {
    const state = useAppState();
    const { current } = useSession();
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
            } else if (format === "notes") {
                state.notes.startNotes();
                onNav("/notes");

                try {
                    await generateNotesContent({
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
                } finally {
                    state.notes.finishNotes();
                }
            } else if (format === "slides") {
                state.slides.startSlides();
                onNav("/slides");

                try {
                    await generateSlidesContent({
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
                } finally {
                    state.slides.finishSlides();
                }
            }
        } catch (err) {
            state.setError(err instanceof Error ? err.message : "Failed to generate content");
        } finally {
            state.setIsLoading(false);
        }
    };

    return { generate };
}
