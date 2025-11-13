import { useCallback } from "react";
import type { InputType } from "@/types";

interface ValidateOptions {
    inputType: InputType;
    promptText: string;
    uploadedDocs: Array<{ id: string; name: string; size: string }>;
    links: string[];
}

export function useUpload() {
    const validate = useCallback((options: ValidateOptions): string | null => {
        if (options.inputType === "prompt" && !options.promptText.trim()) {
            return "Please enter a prompt";
        }
        if (options.inputType === "docs" && options.uploadedDocs.length === 0) {
            return "Upload at least one document";
        }
        if (options.inputType === "links" && options.links.length === 0) {
            return "Please add at least one link";
        }
        return null;
    }, []);

    const getTopicText = useCallback(
        (
            topic: string,
            uploadedDocs: Array<{ id: string; name: string; size: string }>,
            links: string[]
        ): string => {
            if (topic) return topic;
            if (uploadedDocs.length > 0) return uploadedDocs.map((d) => d.name).join(", ");
            if (links.length > 0) return links[0];
            return "session content";
        },
        []
    );

    return { validate, getTopicText };
}
