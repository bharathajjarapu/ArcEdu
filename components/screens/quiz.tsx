"use client";

import { Button } from "@/components/ui/button";
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
  onAnswerSelectAction: (optionId: string) => void;
  onContinueAction: () => void;
  onNextAction: () => void;
  onPreviousAction: () => void;
}

export function QuizScreen({
  quizData,
  currentQuestion,
  selectedAnswer,
  userAnswers,
  showFeedback,
  onAnswerSelectAction,
  onContinueAction,
  onNextAction,
  onPreviousAction,
}: QuizProps) {
  if (!quizData.length) return null;

  const question = quizData[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousAction}
          disabled={currentQuestion === 0}
          className="text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg w-8 h-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-gray-600 text-lg font-medium">
          Question {currentQuestion + 1} of {quizData.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextAction}
          disabled={currentQuestion === quizData.length - 1}
          className="text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg w-8 h-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8 leading-tight">
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
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
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
                    "w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-medium shrink-0",
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

        {showFeedback && (
          <Card className="p-6 mb-8 border-gray-200 bg-gray-50 rounded-xl">
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

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={onPreviousAction}
            disabled={currentQuestion === 0}
            className="text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg"
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
