"use client";

import { useEffect, useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { PageBackButton } from "@/components/back";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types";

interface QuizProps {
  quizData: Quiz[];
  currentQuestion: number;
  selectedAnswer: string | null;
  userAnswers: Record<number, string>;
  showFeedback: boolean;
  revealEnabled: boolean;
  onAnswerSelectAction: (optionId: string) => void;
  onContinueAction: () => void;
  onNextAction: () => void;
  onPreviousAction: () => void;
  onTimeoutAction?: () => void;
  startTime: number;
  questionStartTime: number;
  timeLimit?: number;
  onBackAction: () => void;
}

export function QuizScreen({
  quizData,
  currentQuestion,
  selectedAnswer,
  userAnswers,
  showFeedback,
  revealEnabled,
  onAnswerSelectAction,
  onContinueAction,
  onNextAction,
  onPreviousAction,
  onTimeoutAction,
  startTime,
  questionStartTime,
  timeLimit,
  onBackAction,
}: QuizProps) {
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

  if (!quizData.length) return null;

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

  const question = quizData[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[auto,1fr,auto] md:items-center">
        <PageBackButton label="Back to Format" onClick={onBackAction} className="-ml-3" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-gray-300 rounded-[calc(var(--radius)+2px)]">
            <span className="text-sm uppercase tracking-wider text-gray-500 font-semibold">Q</span>
            <span className="text-sm tabular-nums text-gray-600">
              {formatTime(questionElapsed)}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 border-2 border-gray-300 rounded-[calc(var(--radius)+2px)] transition-all",
            isLowTime ? "border-gray-400 bg-gray-50 animate-pulse" : "border-gray-300"
          )}>
            <span className="text-sm uppercase tracking-wider text-gray-500 font-semibold">T</span>
            <span className={cn("text-sm tabular-nums font-medium", isLowTime ? "text-gray-900" : "text-gray-600")}>
              {remainingTime === Infinity ? "∞" : formatTime(remainingTime)}
            </span>
          </div>
        </div>
        <div className="hidden w-[140px] md:block" aria-hidden="true" />
      </div>

      <div className="mb-8 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousAction}
          disabled={currentQuestion === 0}
          aria-label="Previous question"
          className="h-11 w-11 p-0 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-[calc(var(--radius)+2px)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-center text-lg font-medium text-gray-600 sm:text-2xl">
          Question {currentQuestion + 1} of {quizData.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextAction}
          disabled={currentQuestion === quizData.length - 1}
          aria-label="Next question"
          className="h-11 w-11 p-0 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-[calc(var(--radius)+2px)]"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h2 className="mb-8 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
          {question.question}
        </h2>

        <div className="space-y-4 mb-8">
          {question.options.map((option, index) => {
            const optionId = String.fromCharCode(65 + index);
            const isSelected = selectedAnswer === optionId;
            const isCorrect = index === question.answer;
            const isIncorrect = showFeedback && isSelected && !isCorrect;
            const shouldShowCorrect = showFeedback && isCorrect;

            return (
              <button
                key={index}
                onClick={() => !showFeedback && onAnswerSelectAction(optionId)}
                disabled={showFeedback}
                className={cn(
                  "w-full p-4 rounded-[calc(var(--radius)+2px)] border-2 text-left transition-all duration-200",
                  "flex items-center gap-4",
                  !showFeedback &&
                  !isSelected &&
                  "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                  !showFeedback &&
                  isSelected &&
                  "bg-gray-100 border-gray-900 shadow-sm",
                  isIncorrect && "bg-red-50 border-red-300",
                  shouldShowCorrect && "bg-green-50 border-green-300",
                  showFeedback &&
                  !isIncorrect &&
                  !shouldShowCorrect &&
                  "bg-white border-gray-200",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-[calc(var(--radius)+2px)] border-2 flex items-center justify-center text-sm font-medium shrink-0",
                    !showFeedback &&
                    !isSelected &&
                    "border-gray-300 text-gray-600",
                    !showFeedback &&
                    isSelected &&
                    "border-gray-600 text-gray-700 bg-gray-200",
                    isIncorrect && "border-red-500 bg-red-500 text-white",
                    shouldShowCorrect &&
                    "border-green-500 bg-green-500 text-white",
                    showFeedback &&
                    !isIncorrect &&
                    !shouldShowCorrect &&
                    "border-gray-300 text-gray-600",
                  )}
                >
                  {showFeedback ? (
                    isIncorrect ? (
                      <X className="w-4 h-4" />
                    ) : shouldShowCorrect ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      optionId
                    )
                  ) : (
                    optionId
                  )}
                </div>
                <span className="text-gray-900">{option}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-10">
          {showFeedback && revealEnabled && (
            <Card className="p-6 border-gray-200 bg-gray-50 rounded-[calc(var(--radius)+2px)]">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Explanation</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {question.explanation ||
                      `The correct answer is ${String.fromCharCode(65 + question.answer)}: ${question.options[question.answer]}`}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={onPreviousAction}
            disabled={currentQuestion === 0}
            className={cn(
              "text-gray-600 border-gray-200 rounded-[calc(var(--radius)+2px)] hover:bg-gray-50 hover:border-gray-300",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {!showFeedback ? (
            <Button
              onClick={onContinueAction}
              disabled={!selectedAnswer}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onNextAction}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {currentQuestion === quizData.length - 1 ? "Finish" : "Continue"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
