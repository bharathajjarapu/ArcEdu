"use client";

import { useEffect, useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flashcard, Difficulty, DifficultyCurve } from "@/types";

interface FlashcardsProps {
  flashcardData: Flashcard[];
  currentFlashcard: number;
  isFlashcardFlipped: boolean;
  difficulty: Difficulty;
  difficultyCurve: DifficultyCurve;
  onFlipAction: () => void;
  onScoreAction: (gotIt: boolean) => void;
  onNextAction: () => void;
  onPreviousAction: () => void;
  onTimeoutAction?: () => void;
  startTime: number;
  questionStartTime: number;
  timeLimit?: number;
}

export function Flashcards({
  flashcardData,
  currentFlashcard,
  isFlashcardFlipped,
  difficulty,
  difficultyCurve,
  onFlipAction,
  onScoreAction,
  onNextAction,
  onPreviousAction,
  onTimeoutAction,
  startTime,
  questionStartTime,
  timeLimit,
}: FlashcardsProps) {
  const [now, setNow] = useState(Date.now());
  const timeoutFired = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset timeout guard when session restarts
  useEffect(() => {
    timeoutFired.current = false;
  }, [startTime]);

  if (!flashcardData.length) return null;

  const totalElapsed = Math.floor((now - startTime) / 1000);
  const questionElapsed = Math.floor((now - questionStartTime) / 1000);

  const totalTimeLimit = timeLimit !== undefined && timeLimit > 0 ? timeLimit * 60 : 0;
  const remainingTime = totalTimeLimit > 0 ? Math.max(0, totalTimeLimit - totalElapsed) : Infinity;
  const isLowTime = remainingTime < totalTimeLimit * 0.2;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Auto-redirect when time runs out (fires only once via useEffect)
  useEffect(() => {
    if (remainingTime === 0 && !timeoutFired.current) {
      timeoutFired.current = true;
      if (onTimeoutAction) {
        onTimeoutAction();
      } else {
        onNextAction();
      }
    }
  }, [remainingTime, onTimeoutAction, onNextAction]);

  const card = flashcardData[currentFlashcard];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* TE-Style Timer */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-gray-300 rounded-sm">
          <span className="text-sm uppercase tracking-wider text-gray-500 font-semibold">C</span>
          <span className="text-sm tabular-nums text-gray-600">
            {formatTime(questionElapsed)}
          </span>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 border-2 border-gray-300 rounded-sm transition-all",
          isLowTime ? "border-gray-400 bg-gray-50 animate-pulse" : "border-gray-200"
        )}>
          <span className="text-sm uppercase tracking-wider text-gray-500 font-semibold">Total</span>
          <span className={cn("text-sm tabular-nums font-medium", isLowTime ? "text-gray-900" : "text-gray-600")}>
            {remainingTime === Infinity ? "∞" : formatTime(remainingTime)}
          </span>
        </div>
      </div>

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
          Card {currentFlashcard + 1} of {flashcardData.length} · {difficulty} ({difficultyCurve})
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

          <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gray-100 border-gray-200 rounded-xl flex items-center justify-center p-8">
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

      <div className="flex justify-center gap-4 mb-6">
        <Button
          onClick={() => onScoreAction(false)}
          variant="outline"
          className="bg-red-600 hover:bg-red-700 text-white border-red-700"
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

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="ghost"
          onClick={onPreviousAction}
          disabled={currentFlashcard === 0}
          className="text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg w-full"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <Button
          onClick={onNextAction}
          disabled={currentFlashcard === flashcardData.length - 1}
          className="bg-gray-900 hover:bg-gray-800 text-white w-full"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
