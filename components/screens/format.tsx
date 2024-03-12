"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, HelpCircle, FileText } from "lucide-react";

type Format = "quiz" | "flashcards";

interface Props {
  sessionId: string;
  onSelect: (format: Format, numQuestions: number) => void;
  loading?: boolean;
}

export function FormatScreen({ sessionId, onSelect, loading }: Props) {
  const [numQuestions, setNumQuestions] = React.useState(5);

  const formats = [
    {
      id: "quiz" as Format,
      title: "Quiz",
      description: "Test your knowledge with multiple choice questions",
      icon: HelpCircle,
      color: "blue",
    },
    {
      id: "flashcards" as Format,
      title: "Flashcards",
      description: "Review concepts with flashcard format",
      icon: BookOpen,
      color: "green",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Learning Format</h2>
        <p className="text-gray-600">How would you like to study?</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Questions
            </label>
            <Input
              type="number"
              min="1"
              max="50"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
              className="w-32"
            />
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {formats.map((format) => {
          const Icon = format.icon;
          return (
            <Card
              key={format.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => !loading && onSelect(format.id, numQuestions)}
            >
              <div className="text-center space-y-4">
                <div
                  className={`w-16 h-16 mx-auto rounded-full bg-${format.color}-100 flex items-center justify-center`}
                >
                  <Icon className={`w-8 h-8 text-${format.color}-500`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{format.title}</h3>
                  <p className="text-gray-600 text-sm">{format.description}</p>
                </div>
                <Button className="w-full" disabled={loading}>
                  {loading ? "Generating..." : `Start ${format.title}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
