"use client";

import { useEffect } from "react";
import { Format } from "@/components/screens/format";
import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useGenerate } from "@/hooks/generate";
import { useRouter } from "next/navigation";
import type { Format as FormatType } from "@/types";
import * as sessions from "@/lib/storage/sessions";

export default function FormatPage() {
    const router = useRouter();
    const state = useAppState();
    const { current } = useSession();
    const { generate } = useGenerate();

    useEffect(() => {
        if (!current?.id || state.uploadedDocs.length > 0) return;

        let cancelled = false;
        void sessions.getDocs(current.id).then((docs) => {
            if (cancelled || docs.length === 0) return;
            state.setUploadedDocs(docs.map((doc) => ({
                id: doc.id,
                name: doc.name,
                size: doc.size,
            })));
        });

        return () => {
            cancelled = true;
        };
    }, [current?.id, state.setUploadedDocs, state.uploadedDocs.length]);

    const handleFormatSelect = async (format: FormatType) => {
        await generate(format, (route) => router.push(route));
    };

    return (
        <Format
            selectedFormat={state.selectedFormat}
            setSelectedFormatAction={state.setSelectedFormat}
            numQuestions={state.numQuestions}
            setNumQuestionsAction={state.setNumQuestions}
            difficulty={state.difficulty}
            setDifficultyAction={state.setDifficulty}
            timeLimit={state.timeLimit}
            setTimeLimitAction={state.setTimeLimit}
            revealEnabled={state.revealEnabled}
            setRevealEnabledAction={state.setRevealEnabled}
            uploadedDocs={state.uploadedDocs}
            promptText={state.promptText}
            setPromptTextAction={state.setPromptText}
            notesFormat={state.notesFormat}
            setNotesFormatAction={state.setNotesFormat}
            codeEnabled={state.codeEnabled}
            setCodeEnabledAction={state.setCodeEnabled}
            formulasEnabled={state.formulasEnabled}
            setFormulasEnabledAction={state.setFormulasEnabled}
            diagramsEnabled={state.diagramsEnabled}
            setDiagramsEnabledAction={state.setDiagramsEnabled}
            tablesEnabled={state.tablesEnabled}
            setTablesEnabledAction={state.setTablesEnabled}
            notesLength={state.notesLength}
            setNotesLengthAction={state.setNotesLength}
            numSlides={state.numSlides}
            setNumSlidesAction={state.setNumSlides}
            slideDesign={state.slideDesign}
            setSlideDesignAction={state.setSlideDesign}
            slideColorPalette={state.slideColorPalette}
            setSlideColorPaletteAction={state.setSlideColorPalette}
            error={state.error}
            isLoading={state.isLoading}
            onSelectAction={handleFormatSelect}
            onBackAction={() => router.push("/sessions")}
        />
    );
}
