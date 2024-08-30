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

    const startFlashcards = useCallback(() => {
        setFlashcardData([]);
        setCurrentFlashcard(0);
        setIsFlashcardFlipped(false);
        setFlashcardAnswers({});
    }, []);

    const scoreFlashcard = useCallback((gotIt: boolean) => {
        setFlashcardAnswers(prev => ({ ...prev, [currentFlashcard]: gotIt }));
        if (currentFlashcard < flashcardData.length - 1) {
            setCurrentFlashcard(prev => prev + 1);
            setIsFlashcardFlipped(false);
        }
    }, [currentFlashcard, flashcardData.length]);

    const nextFlashcard = useCallback(() => {
        if (currentFlashcard < flashcardData.length - 1) {
            setCurrentFlashcard(prev => prev + 1);
            setIsFlashcardFlipped(false);
        }
    }, [currentFlashcard, flashcardData.length]);

    const prevFlashcard = useCallback(() => {
        if (currentFlashcard > 0) {
            setCurrentFlashcard(prev => prev - 1);
            setIsFlashcardFlipped(false);
        }
    }, [currentFlashcard]);

    return {
        flashcardData,
        setFlashcardData,
        currentFlashcard,
        isFlashcardFlipped,
        setIsFlashcardFlipped,
        flashcardAnswers,
        startFlashcards,
        scoreFlashcard,
        nextFlashcard,
        prevFlashcard,
        isFlashcardsComplete: currentFlashcard === flashcardData.length - 1 && currentFlashcard in flashcardAnswers
    };
}
