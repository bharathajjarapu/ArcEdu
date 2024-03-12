"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Zap, TrendingUp, RotateCcw } from "lucide-react";
import { time } from "@/lib/utils/format";

interface Props {
  format: "quiz" | "flashcards";
  correct: number;
  total: number;
  accuracy: number;
  totalTime: number;
  fastest: number;
  maxStreak: number;
  onRetry: () => void;
  onNewSession: () => void;
}

export function ResultsScreen({
  format,
  correct,
  total,
  accuracy,
  totalTime,
  fastest,
  maxStreak,
  onRetry,
  onNewSession,
}: Props) {
  const grade = accuracy >= 90 ? "Excellent!" : accuracy >= 70 ? "Good Job!" : accuracy >= 50 ? "Keep Going!" : "Try Again!";
  const gradeColor = accuracy >= 90 ? "text-green-600" : accuracy >= 70 ? "text-blue-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold">Results</h2>
        <p className={`text-2xl font-semibold ${gradeColor}`}>{grade}</p>
      </div>

      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-500">{accuracy}%</div>
          <p className="text-gray-600 mt-2">Accuracy</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{correct}</div>
            <p className="text-sm text-gray-600">Correct</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-2xl font-bold">{total - correct}</div>
            <p className="text-sm text-gray-600">Incorrect</p>
          </div>

          {format === "quiz" && (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{time(totalTime)}</div>
                <p className="text-sm text-gray-600">Total Time</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">{time(fastest)}</div>
                <p className="text-sm text-gray-600">Fastest</p>
              </div>
            </>
          )}
        </div>

        {format === "quiz" && maxStreak > 0 && (
          <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-3">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <p className="text-lg font-semibold text-orange-700">
                Best Streak: {maxStreak} correct in a row! 🔥
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onRetry}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={onNewSession}
        >
          New Session
        </Button>
      </div>
    </div>
  );
}
