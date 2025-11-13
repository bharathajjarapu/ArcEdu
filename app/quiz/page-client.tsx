"use client";

import { memo } from "react";
import { QuizScreen } from "@/components/screens/quiz";
import { useAppState } from "@/contexts/state";
import { useRouter } from "next/navigation";

const MemoizedQuizScreen = memo(QuizScreen);

type QuizPageClientProps = {
    sessionId?: string;
};

export default function QuizPageClient({ sessionId }: QuizPageClientProps) {
    const router = useRouter();
    const state = useAppState();
    const {
        quizData,
        currentQuestion,
        selectedAnswer,
        userAnswers,
        showFeedback,
        setSelectedAnswer,
        submitAnswer,
        isQuizComplete,
        nextQuestion,
        prevQuestion,
        startTime,
        questionStartTime,
    } = state.quiz;
    const backHref = sessionId ? `/sessions/${sessionId}` : "/format";
    const resultsHref = sessionId ? `/results?sessionId=${sessionId}` : "/results";

    if (quizData.length === 0) return null;

    return (
        <MemoizedQuizScreen
            quizData={quizData}
            currentQuestion={currentQuestion}
            selectedAnswer={selectedAnswer}
            userAnswers={userAnswers}
            showFeedback={showFeedback}
            revealEnabled={state.revealEnabled}
            onAnswerSelectAction={setSelectedAnswer}
            onContinueAction={submitAnswer}
            onNextAction={() => {
                if (isQuizComplete) {
                    router.push(resultsHref);
                } else {
                    nextQuestion();
                }
            }}
            onPreviousAction={prevQuestion}
            onTimeoutAction={() => router.push(resultsHref)}
            startTime={startTime}
            questionStartTime={questionStartTime}
            timeLimit={state.timeLimit}
            onBackAction={() => router.push(backHref)}
        />
    );
}
