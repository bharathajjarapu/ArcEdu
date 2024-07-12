"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, HelpCircle, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Format } from "@/types";

interface FormatProps {
  selectedFormat: Format;
  setSelectedFormatAction: (format: Format) => void;
  numQuestions: number;
  setNumQuestionsAction: (num: number) => void;
  error: string | null;
  isLoading: boolean;
  onSelectAction: (format: Format) => void;
}

export function Format({
  selectedFormat,
  setSelectedFormatAction,
  numQuestions,
  setNumQuestionsAction,
  error,
  isLoading,
  onSelectAction,
}: FormatProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose your learning format
        </h1>
        <p className="text-gray-600 text-lg">
          How would you like to study this content?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-2xl mx-auto">
        <Card
          className={cn(
            "p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
            "bg-white/90 backdrop-blur-sm",
            selectedFormat === "quiz"
              ? "border-gray-800 shadow-lg"
              : "border-gray-200 hover:border-gray-300",
          )}
          onClick={() => setSelectedFormatAction("quiz")}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz</h3>
            <p className="text-gray-600 text-sm">
              Test your knowledge with multiple choice questions and get instant
              feedback
            </p>
          </div>
        </Card>

        <Card
          className={cn(
            "p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
            "bg-white/90 backdrop-blur-sm",
            selectedFormat === "flashcards"
              ? "border-gray-800 shadow-lg"
              : "border-gray-200 hover:border-gray-300",
          )}
          onClick={() => setSelectedFormatAction("flashcards")}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Flashcards
            </h3>
            <p className="text-gray-600 text-sm">
              Study with interactive cards featuring terms and definitions with
              flip animations
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-sm border-gray-200 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Number of questions:
          </label>
          <Input
            type="number"
            min="1"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestionsAction(Number(e.target.value))}
            className="w-20 bg-white border-gray-300"
          />
        </div>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="text-center">
        <Button
          onClick={() => onSelectAction(selectedFormat)}
          disabled={isLoading}
          className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Start Learning
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
