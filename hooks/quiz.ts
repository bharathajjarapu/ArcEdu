import { useCallback } from "react";
import type { Quiz } from "@/types";
import {
    clearSessionStorageKey,
    useSessionStorageState,
} from "@/lib/storage";

interface UseQuizProps {
    initialQuizData?: Quiz[];
}

export function useQuiz({ initialQuizData = [] }: UseQuizProps = {}) {
    const [quizData, setQuizData] = useSessionStorageState<Quiz[]>("quiz-data", initialQuizData);

    const [currentQuestion, setCurrentQuestion] = useSessionStorageState("quiz-current-question", 0);
    const [selectedAnswer, setSelectedAnswer] = useSessionStorageState<string | null>("quiz-selected-answer", null);
    const [userAnswers, setUserAnswers] = useSessionStorageState<Record<number, string>>("quiz-user-answers", {});
    const [showFeedback, setShowFeedback] = useSessionStorageState("quiz-show-feedback", false);

    // Stats
    const [startTime, setStartTime] = useSessionStorageState("quiz-start-time", 0);
    const [questionStartTime, setQuestionStartTime] = useSessionStorageState("quiz-question-start-time", 0);
    const [questionTimes, setQuestionTimes] = useSessionStorageState<number[]>("quiz-question-times", []);
    const [currentStreak, setCurrentStreak] = useSessionStorageState("quiz-current-streak", 0);
    const [maxStreak, setMaxStreak] = useSessionStorageState("quiz-max-streak", 0);
    const [isSaved, setIsSaved] = useSessionStorageState("quiz-is-saved", false);

    const startQuiz = useCallback(() => {
        setQuizData([]);
        setCurrentQuestion(0);
        setUserAnswers({});
        setSelectedAnswer(null);
        setShowFeedback(false);
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
        setQuestionTimes([]);
        setCurrentStreak(0);
        setMaxStreak(0);
        setIsSaved(false);
    }, []);

    const submitAnswer = useCallback(() => {
        if (!selectedAnswer) return;

        setUserAnswers(prev => ({ ...prev, [currentQuestion]: selectedAnswer }));
        const timeTaken = Date.now() - questionStartTime;
        setQuestionTimes(prev => [...prev, timeTaken]);

        const selectedIdx = selectedAnswer.charCodeAt(0) - 65;
        const isCorrect = selectedIdx === quizData[currentQuestion].answer;

        if (isCorrect) {
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            setMaxStreak(prev => Math.max(prev, newStreak));
        } else {
            setCurrentStreak(0);
        }

        setShowFeedback(true);
    }, [selectedAnswer, currentQuestion, questionStartTime, quizData, currentStreak]);

    const nextQuestion = useCallback(() => {
        if (currentQuestion < quizData.length - 1) {
            const nextQ = currentQuestion + 1;
            setCurrentQuestion(nextQ);
            setSelectedAnswer(userAnswers[nextQ] || null);
            setShowFeedback(!!userAnswers[nextQ]);
            setQuestionStartTime(Date.now());
        }
    }, [currentQuestion, quizData.length, userAnswers]);

    const prevQuestion = useCallback(() => {
        if (currentQuestion > 0) {
            const prevQ = currentQuestion - 1;
            setCurrentQuestion(prevQ);
            setSelectedAnswer(userAnswers[prevQ] || null);
            setShowFeedback(!!userAnswers[prevQ]);
            setQuestionStartTime(Date.now());
        }
    }, [currentQuestion, userAnswers]);

    const hydrateQuiz = useCallback((data: {
        quizData: Quiz[];
        userAnswers?: Record<number, string>;
        currentQuestion?: number;
        showFeedback?: boolean;
        startTime?: number;
        questionTimes?: number[];
        maxStreak?: number;
        isSaved?: boolean;
    }) => {
        setQuizData(data.quizData);
        setUserAnswers(data.userAnswers || {});
        setCurrentQuestion(data.currentQuestion || 0);
        const restoredAnswer = (data.userAnswers || {})[data.currentQuestion || 0] || null;
        setSelectedAnswer(restoredAnswer);
        setShowFeedback(Boolean(data.showFeedback));
        setStartTime(data.startTime || 0);
        setQuestionStartTime(Date.now());
        setQuestionTimes(data.questionTimes || []);
        setCurrentStreak(0);
        setMaxStreak(data.maxStreak || 0);
        setIsSaved(data.isSaved || false);
    }, [
        setCurrentQuestion,
        setCurrentStreak,
        setMaxStreak,
        setIsSaved,
        setQuestionStartTime,
        setQuestionTimes,
        setQuizData,
        setSelectedAnswer,
        setShowFeedback,
        setStartTime,
        setUserAnswers,
    ]);

    const clearQuiz = useCallback(() => {
        setQuizData([]);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setUserAnswers({});
        setShowFeedback(false);
        setStartTime(0);
        setQuestionStartTime(0);
        setQuestionTimes([]);
        setCurrentStreak(0);
        setMaxStreak(0);
        setIsSaved(false);
        clearSessionStorageKey("quiz-data");
        clearSessionStorageKey("quiz-current-question");
        clearSessionStorageKey("quiz-selected-answer");
        clearSessionStorageKey("quiz-user-answers");
        clearSessionStorageKey("quiz-show-feedback");
        clearSessionStorageKey("quiz-start-time");
        clearSessionStorageKey("quiz-question-start-time");
        clearSessionStorageKey("quiz-question-times");
        clearSessionStorageKey("quiz-current-streak");
        clearSessionStorageKey("quiz-max-streak");
        clearSessionStorageKey("quiz-is-saved");
    }, [
        setCurrentQuestion,
        setCurrentStreak,
        setMaxStreak,
        setIsSaved,
        setQuestionStartTime,
        setQuestionTimes,
        setQuizData,
        setSelectedAnswer,
        setShowFeedback,
        setStartTime,
        setUserAnswers,
    ]);

    return {
        // Data
        quizData,
        setQuizData,

        // Quiz State
        currentQuestion,
        selectedAnswer,
        setSelectedAnswer,
        userAnswers,
        showFeedback,

        // Stats
        startTime,
        questionStartTime,
        questionTimes,
        maxStreak,

        // Actions
        startQuiz,
        submitAnswer,
        nextQuestion,
        prevQuestion,
        hydrateQuiz,
        clearQuiz,
        reviewAnswers: useCallback(() => setCurrentQuestion(0), [setCurrentQuestion]),

        // Helpers
        isSaved,
        setIsSaved,
        isQuizComplete: currentQuestion === quizData.length - 1 && showFeedback,
    };
}
