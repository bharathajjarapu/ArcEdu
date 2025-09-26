"use client";

import { Results } from "@/components/screens/results";
import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useGenerate } from "@/hooks/generate";
import { useRouter } from "next/navigation";

export default function ResultsPage() {
    const router = useRouter();
    const state = useAppState();
    const { current, update, setCurrent, refresh } = useSession();
    const { generate } = useGenerate();

    const handleNewSession = async () => {
        if (current) {
            await update(current.id, { completed: true });
        }
        setCurrent(null);
        state.reset();
        await refresh();
        router.push("/upload");
    };

    const handleRetry = async () => {
        await generate(state.selectedFormat, (route) => router.push(route));
    };

    return (
        <Results
            selectedFormat={state.selectedFormat}
            quizData={state.quiz.quizData}
            userAnswers={state.quiz.userAnswers}
            totalTime={state.quiz.startTime > 0 ? Date.now() - state.quiz.startTime : 0}
            fastestAnswer={state.quiz.questionTimes.length > 0 ? Math.min(...state.quiz.questionTimes) : 0}
            maxStreak={state.quiz.maxStreak}
            onGoBackAction={() => router.push("/format")}
            onNewSessionAction={handleNewSession}
            onRetryAction={handleRetry}
            isLoading={state.isLoading}
        />
    );
}
