"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Plus,
  RotateCcw,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quiz, Format } from "@/types";
import { formatTime } from "@/lib/format";

interface ResultsProps {
  selectedFormat: Format;
  quizData: Quiz[];
  userAnswers: Record<number, string>;
  totalTime: number;
  fastestAnswer: number;
  maxStreak: number;
  onGoBackAction: () => void;
  onNewSessionAction: () => void;
  onRetryAction: () => void;
  isLoading: boolean;
}

export function Results({
  selectedFormat,
  quizData,
  userAnswers,
  totalTime,
  fastestAnswer,
  maxStreak,
  onGoBackAction,
  onNewSessionAction,
  onRetryAction,
  isLoading,
}: ResultsProps) {
  const calcResults = () => {
    const correctAnswers = Object.entries(userAnswers).filter(
      ([questionIndex, answer]) => {
        const selectedIndex = answer.charCodeAt(0) - 65;
        return (
          quizData[Number.parseInt(questionIndex)].answer === selectedIndex
        );
      },
    ).length;

    const totalQuestions = quizData.length;
    const accuracy =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    return {
      correctAnswers,
      totalQuestions,
      accuracy,
    };
  };

  const results = calcResults();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="text-8xl font-bold tracking-tight text-gray-900 mb-4">
          {results.correctAnswers}
          <span className="text-5xl text-gray-500">
            /{results.totalQuestions}
          </span>
        </div>
        <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto mb-8">
          Great job! You answered {results.correctAnswers} out of{" "}
          {results.totalQuestions} questions correctly — that's{" "}
          {results.accuracy}% accuracy!
        </p>

        <div className="flex justify-center gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
            <div className="text-sm text-gray-500 mb-2">Time taken</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatTime(totalTime)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
            <div className="text-sm text-gray-500 mb-2">Fastest answer</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatTime(fastestAnswer)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
            <div className="text-sm text-gray-500 mb-2">Hotstreak</div>
            <div className="text-3xl font-bold text-gray-900">
              {maxStreak}
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-12 w-full">
          <div className="flex flex-wrap justify-center gap-3">
            {quizData.map((question, index) => {
              const userAnswer = userAnswers[index];
              const selectedIndex = userAnswer
                ? userAnswer.charCodeAt(0) - 65
                : -1;
              const isCorrect = selectedIndex === question.answer;
              return (
                <div
                  key={index}
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
                    isCorrect ? "bg-green-500/80" : "bg-red-500/80",
                  )}
                >
                  {isCorrect ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <X className="w-6 h-6 text-white" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          className="text-gray-700 hover:bg-gray-100 border border-gray-200"
          onClick={onGoBackAction}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
        <Button
          variant="ghost"
          className="text-gray-700 hover:bg-gray-100 border border-gray-200"
          onClick={onNewSessionAction}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
        <Button
          className="bg-gray-900 hover:bg-gray-800 text-white"
          disabled={isLoading}
          onClick={onRetryAction}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
