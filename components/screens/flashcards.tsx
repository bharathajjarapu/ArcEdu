"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types";

interface FlashcardsProps {
  flashcardData: Flashcard[];
  currentFlashcard: number;
  isFlashcardFlipped: boolean;
  onFlipAction: () => void;
  onScoreAction: (gotIt: boolean) => void;
  onNextAction: () => void;
  onPreviousAction: () => void;
}

export function Flashcards({
  flashcardData,
  currentFlashcard,
  isFlashcardFlipped,
  onFlipAction,
  onScoreAction,
  onNextAction,
  onPreviousAction,
}: FlashcardsProps) {
  if (!flashcardData.length) return null;

  const card = flashcardData[currentFlashcard];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousAction}
          disabled={currentFlashcard === 0}
          className="text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg w-8 h-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-gray-600 text-lg font-medium">
          Card {currentFlashcard + 1} of {flashcardData.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextAction}
          disabled={currentFlashcard === flashcardData.length - 1}
          className="text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg w-8 h-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="perspective-1000 mb-8">
        <div
          className={cn(
            "relative w-full h-80 cursor-pointer transition-transform duration-700 transform-style-preserve-3d",
            isFlashcardFlipped && "rotate-y-180",
          )}
          onClick={onFlipAction}
        >
          <Card className="absolute inset-0 w-full h-full backface-hidden bg-white border-gray-200 rounded-xl flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                {card.front}
              </h2>
              <p className="text-gray-500 text-sm">
                Click to reveal definition
              </p>
            </div>
          </Card>

          <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gray-50 border-gray-200 rounded-xl flex items-center justify-center p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {card.front}
              </h3>
              <p className="text-gray-700 leading-relaxed">{card.back}</p>
              <p className="text-gray-500 text-sm mt-4">Click to flip back</p>
            </div>
          </Card>
        </div>
      </div>

      {isFlashcardFlipped && (
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={() => onScoreAction(false)}
            variant="outline"
            className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Didn't Get It
          </Button>
          <Button
            onClick={() => onScoreAction(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Got It
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onPreviousAction}
          disabled={currentFlashcard === 0}
          className="text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <Button
          onClick={onNextAction}
          disabled={currentFlashcard === flashcardData.length - 1}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
