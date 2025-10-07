"use client";

import { useEffect } from "react";
import { Upload } from "@/components/screens/upload";
import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useUpload } from "@/hooks/upload";
import { useRouter } from "next/navigation";
import { generateTitle } from "@/lib/api/client";
import * as sessions from "@/lib/storage/sessions";

export default function UploadPage() {
    const router = useRouter();
    const state = useAppState();
    const { current, setCurrent, create, update } = useSession();
    const { validate } = useUpload();

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

    const handleContinue = async () => {
        state.setError(null);

        const error = validate({
            inputType: state.inputType,
            promptText: state.promptText,
            uploadedDocs: state.uploadedDocs,
            links: state.links,
        });

        if (error) {
            state.setError(error);
            return;
        }

        let sessionId: string;
        let currentSession = current;

        if (!current) {
            const newSession = await create("New Session");
            sessionId = newSession.id;
            currentSession = newSession;
            setCurrent(newSession);
        } else {
            sessionId = current.id;
        }

        if (currentSession?.title === "New Session") {
            const content = state.inputType === "docs"
                ? state.uploadedDocs.map((d) => d.name)
                : state.inputType === "prompt"
                    ? state.promptText.substring(0, 100)
                    : state.links[0];

            const hasContent = Array.isArray(content) ? content.length > 0 : Boolean(content);

            if (hasContent) {
                const title = await generateTitle(content as string | string[]);
                await update(sessionId, { title });
            }
        }

        router.push("/format");
    };

    return (
        <Upload
            uploadedDocs={state.uploadedDocs}
            setUploadedDocsAction={state.setUploadedDocs}
            error={state.error}
            setErrorAction={state.setError}
            isLoading={state.isLoading}
            setIsLoadingAction={state.setIsLoading}
            activeSessionId={current?.id || null}
            onCreateAction={async (title) => {
                const session = await create(title);
                setCurrent(session);
                return session;
            }}
            onUpdateSessionAction={update}
            onContinueAction={handleContinue}
        />
    );
}
