import { useState, useCallback } from "react";
import type { Quiz } from "@/types";

interface UseQuizProps {
    initialQuizData?: Quiz[];
}

export function useQuiz({ initialQuizData = [] }: UseQuizProps = {}) {
    const [quizData, setQuizData] = useState<Quiz[]>(initialQuizData);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showFeedback, setShowFeedback] = useState(false);

    // Stats
    const [startTime, setStartTime] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [questionTimes, setQuestionTimes] = useState<number[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);

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

        // Helpers
        isQuizComplete: currentQuestion === quizData.length - 1 && showFeedback,
    };
}
