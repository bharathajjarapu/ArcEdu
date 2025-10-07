"use client";

import { useEffect, useRef } from "react";
import { Results } from "@/components/screens/results";
import { useAppState } from "@/contexts/state";
import { useSession } from "@/contexts/session";
import { useGenerate } from "@/hooks/generate";
import { useRouter } from "next/navigation";
import * as sessions from "@/lib/storage/sessions";

type ResultsPageClientProps = {
    sessionId?: string;
};

export default function ResultsPageClient({ sessionId }: ResultsPageClientProps) {
    const router = useRouter();
    const state = useAppState();
    const { current, update, setCurrent, refresh } = useSession();
    const { generate } = useGenerate();
    const hasSavedRef = useRef(false);
    const {
        quizData,
        userAnswers,
        questionTimes,
        maxStreak,
        startTime,
        isSaved,
        setIsSaved,
        reviewAnswers,
    } = state.quiz;
    const selectedFormat = state.selectedFormat;
    const backHref = sessionId ? `/sessions/${sessionId}` : "/format";
    const quizHref = sessionId ? `/quiz?sessionId=${sessionId}` : "/quiz";

    useEffect(() => {
        if (!current?.id || selectedFormat !== "quiz" || quizData.length === 0 || hasSavedRef.current || isSaved) {
            return;
        }

        const correctAnswers = Object.entries(userAnswers).filter(([questionIndex, answer]) => {
            const selectedIndex = answer.charCodeAt(0) - 65;
            return quizData[Number(questionIndex)]?.answer === selectedIndex;
        }).length;

        hasSavedRef.current = true;
        setIsSaved(true);

        void sessions.saveQuiz({
            id: crypto.randomUUID(),
            sessionId: current.id,
            quizData,
            answers: userAnswers,
            score: correctAnswers,
            completedAt: Date.now(),
            totalTime: startTime > 0 ? Date.now() - startTime : 0,
            questionTimes,
            maxStreak,
        });
    }, [
        current?.id,
        maxStreak,
        questionTimes,
        quizData,
        selectedFormat,
        startTime,
        userAnswers,
        isSaved,
        setIsSaved,
    ]);

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

    const handleReview = () => {
        reviewAnswers();
        router.push(quizHref);
    };

    return (
        <Results
            selectedFormat={selectedFormat}
            quizData={quizData}
            userAnswers={userAnswers}
            totalTime={startTime > 0 ? Date.now() - startTime : 0}
            fastestAnswer={questionTimes.length > 0 ? Math.min(...questionTimes) : 0}
            maxStreak={maxStreak}
            onGoBackAction={() => router.push(backHref)}
            onNewSessionAction={handleNewSession}
            onRetryAction={handleRetry}
            onReviewAction={handleReview}
            isLoading={state.isLoading}
        />
    );
}
