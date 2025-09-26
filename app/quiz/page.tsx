"use client";

import { memo } from "react";
import { QuizScreen } from "@/components/screens/quiz";
import { useAppState } from "@/contexts/state";
import { useRouter } from "next/navigation";

const MemoizedQuizScreen = memo(QuizScreen);

export default function QuizPage() {
    const router = useRouter();
    const state = useAppState();

    if (state.quiz.quizData.length === 0) return null;

    return (
        <MemoizedQuizScreen
            quizData={state.quiz.quizData}
            currentQuestion={state.quiz.currentQuestion}
            selectedAnswer={state.quiz.selectedAnswer}
            userAnswers={state.quiz.userAnswers}
            showFeedback={state.quiz.showFeedback}
            revealEnabled={state.revealEnabled}
            onAnswerSelectAction={state.quiz.setSelectedAnswer}
            onContinueAction={state.quiz.submitAnswer}
            onNextAction={() => {
                if (state.quiz.isQuizComplete) {
                    router.push("/results");
                } else {
                    state.quiz.nextQuestion();
                }
            }}
            onPreviousAction={state.quiz.prevQuestion}
            onTimeoutAction={() => router.push("/results")}
            startTime={state.quiz.startTime}
            questionStartTime={state.quiz.questionStartTime}
            timeLimit={state.timeLimit}
        />
    );
}
