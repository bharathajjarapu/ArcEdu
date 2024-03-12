"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Flashcard } from "@/types";

interface Props {
  data: Flashcard[];
  sessionId: string;
  onComplete: (answers: Record<number, boolean>) => void;
}

export function CardsScreen({ data, sessionId, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const handleScore = (gotIt: boolean) => {
    const newAnswers = { ...answers, [current]: gotIt };
    setAnswers(newAnswers);

    if (current < data.length - 1) {
      setCurrent(current + 1);
      setFlipped(false);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleNext = () => {
    if (current < data.length - 1) {
      setCurrent(current + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setFlipped(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Flashcards</h2>
        <div className="text-sm text-gray-600">
          Card {current + 1} of {data.length}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / data.length) * 100}%` }}
        />
      </div>

      <Card
        className="p-8 min-h-[300px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setFlipped(!flipped)}
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="text-2xl font-semibold">
            {flipped ? data[current].back : data[current].front}
          </p>
          {!flipped && (
            <p className="text-sm text-gray-400 mt-6">
              Click to reveal answer
            </p>
          )}
        </div>
      </Card>

      {flipped && (
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleScore(false)}
            className="flex-1 max-w-xs"
          >
            <ThumbsDown className="w-5 h-5 mr-2" />
            Need Review
          </Button>
          <Button
            size="lg"
            onClick={() => handleScore(true)}
            className="flex-1 max-w-xs bg-green-500 hover:bg-green-600"
          >
            <ThumbsUp className="w-5 h-5 mr-2" />
            Got It
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={current === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleNext}
          disabled={current === data.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
