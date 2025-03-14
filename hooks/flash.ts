import { useState, useCallback } from "react";
import type { Flashcard } from "@/types";

interface UseFlashProps {
    initialFlashcardData?: Flashcard[];
}

export function useFlash({ initialFlashcardData = [] }: UseFlashProps = {}) {
    const [flashcardData, setFlashcardData] = useState<Flashcard[]>(initialFlashcardData);
    const [currentFlashcard, setCurrentFlashcard] = useState(0);
    const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
    const [flashcardAnswers, setFlashcardAnswers] = useState<Record<number, boolean>>({});

    // Stats
    const [startTime, setStartTime] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);

    const startFlashcards = useCallback(() => {
        setFlashcardData([]);
        setCurrentFlashcard(0);
        setIsFlashcardFlipped(false);
        setFlashcardAnswers({});
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
    }, []);

    const scoreFlashcard = useCallback((gotIt: boolean) => {
        setFlashcardAnswers(prev => ({ ...prev, [currentFlashcard]: gotIt }));
        if (currentFlashcard < flashcardData.length - 1) {
            setCurrentFlashcard(prev => prev + 1);
            setIsFlashcardFlipped(false);
            setQuestionStartTime(Date.now());
        }
    }, [currentFlashcard, flashcardData.length]);

    const nextFlashcard = useCallback(() => {
        if (currentFlashcard < flashcardData.length - 1) {
            setCurrentFlashcard(prev => prev + 1);
            setIsFlashcardFlipped(false);
            setQuestionStartTime(Date.now());
        }
    }, [currentFlashcard, flashcardData.length]);

    const prevFlashcard = useCallback(() => {
        if (currentFlashcard > 0) {
            setCurrentFlashcard(prev => prev - 1);
            setIsFlashcardFlipped(false);
            setQuestionStartTime(Date.now());
        }
    }, [currentFlashcard]);

    return {
        flashcardData,
        setFlashcardData,
        currentFlashcard,
        isFlashcardFlipped,
        setIsFlashcardFlipped,
        flashcardAnswers,
        startTime,
        questionStartTime,
        startFlashcards,
        scoreFlashcard,
        nextFlashcard,
        prevFlashcard,
        isFlashcardsComplete: currentFlashcard === flashcardData.length - 1 && currentFlashcard in flashcardAnswers
    };
}
