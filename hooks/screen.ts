import { useState, useEffect, useCallback } from "react";
import type { Screen, Format, InputType } from "@/types";

const validScreens: Screen[] = ["sessions", "upload", "format", "quiz", "flashcards", "results"];

function getScreenFromHash(): Screen {
    if (typeof window === "undefined") return "upload";
    const hash = window.location.hash.slice(1);
    return validScreens.includes(hash as Screen) ? (hash as Screen) : "upload";
}

export function useScreen() {
    const [screen, setScreenState] = useState<Screen>("upload");

    // Sync screen to URL hash
    const setScreen = useCallback((newScreen: Screen) => {
        setScreenState(newScreen);
        if (typeof window !== "undefined") {
            window.history.pushState(null, "", `#${newScreen}`);
        }
    }, []);

    // Initialize from hash and listen for back/forward
    useEffect(() => {
        if (typeof window === "undefined") return;

        setScreenState(getScreenFromHash());

        const handlePopState = () => {
            setScreenState(getScreenFromHash());
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
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
