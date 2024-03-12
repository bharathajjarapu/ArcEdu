"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface Props {
  question: string;
  options: string[];
  answer: number;
  selected: string | null;
  showFeedback: boolean;
  onSelect: (option: string) => void;
}

export function QuizQuestion({ question, options, answer, selected, showFeedback, onSelect }: Props) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">{question}</h3>
      <div className="space-y-3">
        {options.map((option, idx) => {
          const optionId = String.fromCharCode(65 + idx);
          const isSelected = selected === optionId;
          const isCorrect = idx === answer;
          const showCorrect = showFeedback && isCorrect;
          const showWrong = showFeedback && isSelected && !isCorrect;

          return (
            <Button
              key={idx}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "w-full justify-start text-left h-auto py-3 px-4",
                showCorrect && "bg-green-500 hover:bg-green-600 text-white",
                showWrong && "bg-red-500 hover:bg-red-600 text-white"
              )}
              onClick={() => !showFeedback && onSelect(optionId)}
              disabled={showFeedback}
            >
              <span className="font-medium mr-3">{optionId}.</span>
              <span className="flex-1">{option}</span>
              {showCorrect && <Check className="w-5 h-5 ml-2" />}
              {showWrong && <X className="w-5 h-5 ml-2" />}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
