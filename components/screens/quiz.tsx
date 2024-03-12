"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizQuestion } from "@/components/shared/question";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Quiz } from "@/types";

interface Props {
  data: Quiz[];
  sessionId: string;
  onComplete: (answers: Record<number, string>, times: number[], streak: number) => void;
}

export function QuizScreen({ data, sessionId, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [times, setTimes] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const handleSelect = (option: string) => {
    setSelected(option);
  };

  const handleContinue = () => {
    if (selected) {
      const newAnswers = { ...answers, [current]: selected };
      setAnswers(newAnswers);
      setFeedback(true);

      const time = Date.now() - questionStart;
      setTimes(prev => [...prev, time]);

      const selectedIdx = selected.charCodeAt(0) - 65;
      const isCorrect = selectedIdx === data[current].answer;

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak(Math.max(maxStreak, newStreak));
      } else {
        setStreak(0);
      }
    }
  };

  const handleNext = () => {
    if (current < data.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setFeedback(false);
      setQuestionStart(Date.now());
    } else {
      onComplete(answers, times, maxStreak);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSelected(answers[current - 1] || null);
      setFeedback(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No quiz questions available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quiz</h2>
        <div className="text-sm text-gray-600">
          Question {current + 1} of {data.length}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / data.length) * 100}%` }}
        />
      </div>

      <QuizQuestion
        question={data[current].question}
        options={data[current].options}
        answer={data[current].answer}
        selected={selected}
        showFeedback={feedback}
        onSelect={handleSelect}
      />

      {streak > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-green-700 font-medium">
            🔥 {streak} correct in a row!
          </p>
        </Card>
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

        {!feedback ? (
          <Button
            className="flex-1"
            onClick={handleContinue}
            disabled={!selected}
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleNext}
          >
            {current < data.length - 1 ? "Next Question" : "View Results"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
