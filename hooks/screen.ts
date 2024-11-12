import { useState, useCallback, useSyncExternalStore } from "react";
import type { Screen, Format, InputType } from "@/types";

const validScreens: Screen[] = ["sessions", "upload", "format", "quiz", "flashcards", "results"];

function getScreenFromPath(): Screen {
    if (typeof window === "undefined") return "upload";
    const path = window.location.pathname.slice(1) || "upload";
    return validScreens.includes(path as Screen) ? (path as Screen) : "upload";
}

let listeners: (() => void)[] = [];

function subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    listeners.push(callback);
    window.addEventListener("popstate", callback);
    return () => {
        listeners = listeners.filter(l => l !== callback);
        window.removeEventListener("popstate", callback);
    };
}

function emitChange() {
    listeners.forEach(l => l());
}

export function useScreen() {
    const screen = useSyncExternalStore(subscribe, getScreenFromPath, () => "upload" as Screen);

    const setScreen = useCallback((newScreen: Screen) => {
        if (typeof window === "undefined") return;
        window.history.pushState(null, "", `/${newScreen}`);
        emitChange();
    }, []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Input State
    const [inputType, setInputType] = useState<InputType>("docs");
    const [promptText, setPromptText] = useState("");
    const [links, setLinks] = useState<string[]>([]);
    const [currentLink, setCurrentLink] = useState("");
    const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; name: string; size: string }>>([]);

    // Format State
    const [selectedFormat, setSelectedFormat] = useState<Format>("quiz");
    const [numQuestions, setNumQuestions] = useState(5);
    const [topic, setTopic] = useState("");

    const reset = useCallback(() => {
        setScreen("upload");
        setError(null);
        setInputType("docs");
        setPromptText("");
        setLinks([]);
        setCurrentLink("");
        setUploadedDocs([]);
        setSelectedFormat("quiz");
        setTopic("");
        setNumQuestions(5);
    }, [setScreen]);

    return {
        screen,
        setScreen,
        isLoading,
        setIsLoading,
        error,
        setError,
        inputType,
        setInputType,
        promptText,
        setPromptText,
        links,
        setLinks,
        currentLink,
        setCurrentLink,
        uploadedDocs,
        setUploadedDocs,
        selectedFormat,
        setSelectedFormat,
        numQuestions,
        setNumQuestions,
        topic,
        setTopic,
        reset
    };
}
