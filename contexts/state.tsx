"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useQuiz } from "@/hooks/quiz";
import { useNotes } from "@/hooks/notes";
import { useSlides } from "@/hooks/slides";
import type { Format, InputType, Difficulty, NotesFormat, NotesLength, SlideColorPalette } from "@/types";

interface Doc { id: string; name: string; size: string }

interface StateContextValue {
    isLoading: boolean;
    setIsLoading: (v: boolean) => void;
    error: string | null;
    setError: (v: string | null) => void;
    inputType: InputType;
    setInputType: (v: InputType) => void;
    promptText: string;
    setPromptText: (v: string) => void;
    links: string[];
    setLinks: (v: string[]) => void;
    currentLink: string;
    setCurrentLink: (v: string) => void;
    uploadedDocs: Doc[];
    setUploadedDocs: (v: Doc[]) => void;
    selectedFormat: Format;
    setSelectedFormat: (v: Format) => void;
    numQuestions: number;
    setNumQuestions: (v: number) => void;
    topic: string;
    setTopic: (v: string) => void;
    difficulty: Difficulty;
    setDifficulty: (v: Difficulty) => void;
    timeLimit: number;
    setTimeLimit: (v: number) => void;
    revealEnabled: boolean;
    setRevealEnabled: (v: boolean) => void;
    notesFormat: NotesFormat;
    setNotesFormat: (v: NotesFormat) => void;
    notesLength: NotesLength;
    setNotesLength: (v: NotesLength) => void;
    codeEnabled: boolean;
    setCodeEnabled: (v: boolean) => void;
    formulasEnabled: boolean;
    setFormulasEnabled: (v: boolean) => void;
    diagramsEnabled: boolean;
    setDiagramsEnabled: (v: boolean) => void;
    tablesEnabled: boolean;
    setTablesEnabled: (v: boolean) => void;
    numSlides: number;
    setNumSlides: (v: number) => void;
    slideDesign: string;
    setSlideDesign: (v: string) => void;
    slideColorPalette: SlideColorPalette;
    setSlideColorPalette: (v: SlideColorPalette) => void;
    quiz: ReturnType<typeof useQuiz>;
    notes: ReturnType<typeof useNotes>;
    slides: ReturnType<typeof useSlides>;
    reset: () => void;
}

const StateContext = createContext<StateContextValue | null>(null);

export function StateProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputType, setInputType] = useState<InputType>("docs");
    const [promptText, setPromptText] = useState("");
    const [links, setLinks] = useState<string[]>([]);
    const [currentLink, setCurrentLink] = useState("");
    const [uploadedDocs, setUploadedDocs] = useState<Doc[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<Format>("quiz");
    const [numQuestions, setNumQuestions] = useState(5);
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [timeLimit, setTimeLimit] = useState(5);
    const [revealEnabled, setRevealEnabled] = useState(true);
    const [notesFormat, setNotesFormat] = useState<NotesFormat>("structured");
    const [notesLength, setNotesLength] = useState<NotesLength>("medium");
    const [codeEnabled, setCodeEnabled] = useState(true);
    const [formulasEnabled, setFormulasEnabled] = useState(true);
    const [diagramsEnabled, setDiagramsEnabled] = useState(true);
    const [tablesEnabled, setTablesEnabled] = useState(true);
    const [numSlides, setNumSlides] = useState(10);
    const [slideDesign, setSlideDesign] = useState("professional");
    const [slideColorPalette, setSlideColorPalette] = useState<SlideColorPalette>("colorful");

    const quiz = useQuiz();
    const notesHook = useNotes();
    const slidesHook = useSlides();

    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setInputType("docs");
        setPromptText("");
        setLinks([]);
        setCurrentLink("");
        setUploadedDocs([]);
        setSelectedFormat("quiz");
        setTopic("");
        setNumQuestions(5);
        setDifficulty("medium");
        setTimeLimit(5);
        setRevealEnabled(true);
        setNotesFormat("structured");
        setNotesLength("medium");
        setCodeEnabled(true);
        setFormulasEnabled(true);
        setDiagramsEnabled(true);
        setTablesEnabled(true);
        setNumSlides(10);
        setSlideDesign("professional");
        setSlideColorPalette("colorful");
        quiz.clearQuiz();
        notesHook.clearNotes();
        slidesHook.clearSlides();
    }, [notesHook, quiz, slidesHook]);

    return (
        <StateContext.Provider value={{
            isLoading, setIsLoading, error, setError,
            inputType, setInputType, promptText, setPromptText,
            links, setLinks, currentLink, setCurrentLink,
            uploadedDocs, setUploadedDocs,
            selectedFormat, setSelectedFormat,
            numQuestions, setNumQuestions, topic, setTopic,
            difficulty, setDifficulty, timeLimit, setTimeLimit,
            revealEnabled, setRevealEnabled,
            notesFormat, setNotesFormat, notesLength, setNotesLength,
            codeEnabled, setCodeEnabled, formulasEnabled, setFormulasEnabled,
            diagramsEnabled, setDiagramsEnabled, tablesEnabled, setTablesEnabled,
            numSlides, setNumSlides, slideDesign, setSlideDesign,
            slideColorPalette, setSlideColorPalette,
            quiz, notes: notesHook, slides: slidesHook,
            reset,
        }}>
            {children}
        </StateContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(StateContext);
    if (!context) throw new Error("useAppState must be used within StateProvider");
    return context;
}
