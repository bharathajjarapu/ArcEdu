import { useState } from "react";
import type { Screen, Format, InputType } from "@/types";

export function useScreen() {
    const [screen, setScreen] = useState<Screen>("upload");
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

    const reset = () => {
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
    };

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
