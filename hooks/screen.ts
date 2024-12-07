import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import type { Screen, Format, InputType } from "@/types";

const validScreens: Screen[] = ["sessions", "upload", "format", "quiz", "flashcards", "results"];

let listeners: (() => void)[] = [];
let currentScreen: Screen = "upload";
let popstateAttached = false;

const handlePopState = (event: PopStateEvent) => {
    const stateScreen = (event.state?.screen || "upload") as Screen;
    currentScreen = validScreens.includes(stateScreen) ? stateScreen : "upload";
    emitChange();
};

function subscribe(callback: () => void) {
    if (typeof window === "undefined") return () => {};
    listeners.push(callback);
    if (!popstateAttached) {
        window.addEventListener("popstate", handlePopState);
        popstateAttached = true;
    }
    return () => {
        listeners = listeners.filter(l => l !== callback);
        if (popstateAttached && listeners.length === 0) {
            window.removeEventListener("popstate", handlePopState);
            popstateAttached = false;
        }
    };
}

function emitChange() {
    listeners.forEach(l => l());
}

export function useScreen() {
    const getCurrentScreen = useCallback(() => currentScreen, []);
    const screen = useSyncExternalStore(subscribe, getCurrentScreen, () => "upload" as Screen);

    const setScreen = useCallback((newScreen: Screen) => {
        if (typeof window === "undefined") return;
        currentScreen = newScreen;
        window.history.pushState({ screen: newScreen }, "", `/${newScreen}`);
        emitChange();
    }, []);
    
    useEffect(() => {
        if (typeof window === "undefined") return;
        const path = window.location.pathname.slice(1) || "upload";
        const pathScreen = validScreens.includes(path as Screen) ? (path as Screen) : "upload";
        // Sync the in-memory screen to the URL without adding a history entry
        currentScreen = pathScreen;
        window.history.replaceState({ screen: pathScreen }, "", `/${pathScreen}`);
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
