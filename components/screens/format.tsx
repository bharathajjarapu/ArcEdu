"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  HelpCircle,
  BookOpen,
  Loader2,
  Zap,
  Target,
  Sparkles,
  Minus,
  Plus,
  StickyNote,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Format, Difficulty } from "@/types";

interface FormatProps {
  selectedFormat: Format;
  setSelectedFormatAction: (format: Format) => void;
  numQuestions: number;
  setNumQuestionsAction: (num: number) => void;
  difficulty: Difficulty;
  setDifficultyAction: (difficulty: Difficulty) => void;
  uploadedDocs: Array<{ id: string; name: string; size: string }>;
  promptText: string;
  setPromptTextAction: (text: string) => void;
  error: string | null;
  isLoading: boolean;
  onSelectAction: (format: Format) => void;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    icon: Zap,
    color: "text-emerald-600",
    activeBg: "bg-emerald-100",
    activeBorder: "border-emerald-500",
  },
  medium: {
    label: "Medium",
    icon: Target,
    color: "text-amber-600",
    activeBg: "bg-amber-100",
    activeBorder: "border-amber-500",
  },
  hard: {
    label: "Hard",
    icon: Sparkles,
    color: "text-rose-600",
    activeBg: "bg-rose-100",
    activeBorder: "border-rose-500",
  },
  adaptive: {
    label: "Adaptive",
    icon: Sparkles,
    color: "text-violet-600",
    activeBg: "bg-violet-100",
    activeBorder: "border-violet-500",
  },
};

const questionPresets = [3, 5, 10, 15, 20, 25, 30];
const timePresets = [0, 3, 5, 10, 20];

export function Format({
  selectedFormat,
  setSelectedFormatAction,
  numQuestions,
  setNumQuestionsAction,
  difficulty,
  setDifficultyAction,
  uploadedDocs,
  promptText,
  setPromptTextAction,
  error,
  isLoading,
  onSelectAction,
}: FormatProps) {
  const [totalSeconds, setTotalSeconds] = useState<number>(600); // 10:00 default
  const [minInput, setMinInput] = useState("10");
  const [secInput, setSecInput] = useState("00");
  const [isEditingMin, setIsEditingMin] = useState(false);
  const [isEditingSec, setIsEditingSec] = useState(false);

  const timeMinutes = Math.floor(totalSeconds / 60);
  const timeSeconds = totalSeconds % 60;

  // Sync inputs when totalSeconds changes externally (presets, +/-)
  useEffect(() => {
    if (!isEditingMin) {
      setMinInput(String(timeMinutes).padStart(2, "0"));
    }
    if (!isEditingSec) {
      setSecInput(String(timeSeconds).padStart(2, "0"));
    }
  }, [timeMinutes, timeSeconds, isEditingMin, isEditingSec]);

  const incrementTime = () => {
    setTotalSeconds((t) => Math.min(20 * 60, t + 1));
  };

  const decrementTime = () => {
    setTotalSeconds((t) => Math.max(0, t - 1));
  };

  const handleMinutesBlur = () => {
    const num = parseInt(minInput) || 0;
    const clamped = Math.min(20, Math.max(0, num));
    setTotalSeconds(clamped * 60 + timeSeconds);
    setMinInput(String(clamped).padStart(2, "0"));
    setIsEditingMin(false);
  };

  const handleSecondsBlur = () => {
    const num = parseInt(secInput) || 0;
    const clamped = Math.min(59, Math.max(0, num));
    setTotalSeconds(timeMinutes * 60 + clamped);
    setSecInput(String(clamped).padStart(2, "0"));
    setIsEditingSec(false);
  };

  const setPresetTime = (minutes: number) => {
    const clamped = Math.min(20, Math.max(0, minutes));
    setTotalSeconds(clamped * 60);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Setup your Learning
        </h1>
        <p className="mt-2 text-gray-700 text-xl font-medium leading-relaxed">
          How would you like to study ?
        </p>
      </div>

      {/* Format Selection - 3 columns */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Notes */}
          <button
            onClick={() => setSelectedFormatAction("notes")}
            className={cn(
              "group relative p-5 rounded-2xl border-2 transition-all duration-200 text-left",
              selectedFormat === "notes"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                selectedFormat === "notes" ? "bg-white/10" : "bg-gray-100"
              )}
            >
              <StickyNote
                className={cn(
                  "w-5 h-5",
                  selectedFormat === "notes" ? "text-white" : "text-gray-600"
                )}
              />
            </div>
            <h3 className="text-lg font-semibold mb-1">Notes</h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                selectedFormat === "notes" ? "text-gray-300" : "text-gray-500"
              )}
            >
              Study notes summary
            </p>
            {selectedFormat === "notes" && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white" />
            )}
          </button>

          {/* Quiz */}
          <button
            onClick={() => setSelectedFormatAction("quiz")}
            className={cn(
              "group relative p-5 rounded-2xl border-2 transition-all duration-200 text-left",
              selectedFormat === "quiz"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                selectedFormat === "quiz" ? "bg-white/10" : "bg-gray-100"
              )}
            >
              <HelpCircle
                className={cn(
                  "w-5 h-5",
                  selectedFormat === "quiz" ? "text-white" : "text-gray-600"
                )}
              />
            </div>
            <h3 className="text-lg font-semibold mb-1">Quiz</h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                selectedFormat === "quiz" ? "text-gray-300" : "text-gray-500"
              )}
            >
              Multiple choice questions
            </p>
            {selectedFormat === "quiz" && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white" />
            )}
          </button>

          {/* Flashcards */}
          <button
            onClick={() => setSelectedFormatAction("flashcards")}
            className={cn(
              "group relative p-5 rounded-2xl border-2 transition-all duration-200 text-left",
              selectedFormat === "flashcards"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                selectedFormat === "flashcards" ? "bg-white/10" : "bg-gray-100"
              )}
            >
              <BookOpen
                className={cn(
                  "w-5 h-5",
                  selectedFormat === "flashcards"
                    ? "text-white"
                    : "text-gray-600"
                )}
              />
            </div>
            <h3 className="text-lg font-semibold mb-1">Flashcards</h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                selectedFormat === "flashcards"
                  ? "text-gray-300"
                  : "text-gray-500"
              )}
            >
              Flip cards for memorization
            </p>
            {selectedFormat === "flashcards" && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content - Documents on left, Options on right */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          {/* Documents Panel - takes 1 column, full height */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-2 border-gray-100 flex-shrink-0">
              <div className="flex items-center ">
                <span className="text-sm font-bold text-gray-600 tracking-wider">Documents</span>
              </div>
            </div>
            <div className="px-4 flex-1 overflow-y-auto">
              {uploadedDocs.length > 0 ? (
                <div className="space-y-1">
                  {uploadedDocs.map((doc) => {
                    const lastDotIndex = doc.name.lastIndexOf('.');
                    const fileName = lastDotIndex > -1 ? doc.name.substring(0, lastDotIndex) : doc.name;
                    const fileExt = lastDotIndex > -1 ? doc.name.substring(lastDotIndex + 1).toUpperCase() : '';
                    return (
                      <div
                        key={doc.id}
                        className="group relative bg-white hover:bg-gray-50 rounded-md px-2.5 py-1.5 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 truncate">
                              {fileName}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                            <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{doc.size}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-400 uppercase flex-shrink-0">{fileExt}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No documents</p>
                  <p className="text-xs text-gray-400 mt-1">Upload files to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Options Panel - takes 2 columns */}
          <div className="col-span-2 space-y-3">
            {/* Prompt Input */}
            <textarea
              placeholder="Focus your learning — describe what topics or concepts to emphasize..."
              value={promptText}
              onChange={(e) => setPromptTextAction(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm bg-white font-semibold text-gray-500 focus:bg-gray-50 border-2 border-gray-200 focus:border-gray-300 rounded-xl transition-colors"
            />

            {/* Difficulty Selection */}
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(difficultyConfig) as Difficulty[]).map((level) => {
                const config = difficultyConfig[level];
                const isActive = difficulty === level;
                const Icon = config.icon;

                return (
                  <button
                    key={level}
                    onClick={() => setDifficultyAction(level)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all duration-200",
                      isActive
                        ? `${config.activeBg} ${config.activeBorder}`
                        : `bg-white border-gray-200 hover:border-gray-300`
                    )}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Icon
                        className={cn(
                          "w-5 h-5 mb-1.5",
                          isActive ? config.color : "text-gray-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-gray-900" : "text-gray-600"
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    {isActive && (
                      <div
                        className={cn(
                          "absolute top-2 right-2 w-1.5 h-1.5 rounded-full",
                          config.color.replace("text-", "bg-")
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Question Count + Time */}
            <div className="grid grid-cols-2 gap-3">
              {/* Questions */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                <div className="flex justify-between mb-4 h-14 items-start pt-1">
                  <button
                    onClick={() => setNumQuestionsAction(Math.max(1, numQuestions - 1))}
                    disabled={numQuestions <= 1}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 tabular-nums leading-none">
                      {numQuestions}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      questions
                    </span>
                  </div>
                  <button
                    onClick={() => setNumQuestionsAction(Math.min(30, numQuestions + 1))}
                    disabled={numQuestions >= 30}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {questionPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setNumQuestionsAction(preset)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        numQuestions === preset
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 relative">
                {/* Plus/Minus buttons - top right */}
                <div className="absolute top-0 right-0 flex flex-col h-full">
                  <button
                    onClick={incrementTime}
                    className="flex-1 w-12 rounded-tr-2xl border-l border-b border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={decrementTime}
                    className="flex-1 w-12 rounded-br-2xl border-l border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>

                {/* Time display and presets */}
                <div className="pr-14 flex flex-col items-center justify-between h-full">
                  <div className="flex items-center justify-center gap-3 mb-4 h-14">
                    <span className="text-lg text-gray-500 uppercase tracking-wider">time</span>
                    {totalSeconds === 0 ? (
                      <span className="text-5xl font-bold text-gray-800 tabular-nums leading-none">∞</span>
                    ) : (
                      <div className="flex items-center">
                        <div className="bg-gray-100 rounded-lg px-2">
                          <input
                            type="text"
                            value={minInput}
                            onChange={(e) => setMinInput(e.target.value.replace(/\D/g, "").slice(0, 2))}
                            onFocus={() => setIsEditingMin(true)}
                            onBlur={handleMinutesBlur}
                            className="w-14 text-center text-5xl font-bold text-gray-800 tabular-nums bg-transparent focus:outline-none cursor-text caret-gray-400 selection:bg-gray-200 leading-none py-1"
                            maxLength={2}
                          />
                        </div>
                        <span className="text-3xl font-bold text-gray-300 mx-0.5 leading-none">:</span>
                        <div className="bg-gray-100 rounded-lg px-2">
                          <input
                            type="text"
                            value={secInput}
                            onChange={(e) => setSecInput(e.target.value.replace(/\D/g, "").slice(0, 2))}
                            onFocus={() => setIsEditingSec(true)}
                            onBlur={handleSecondsBlur}
                            className="w-14 text-center text-5xl font-bold text-gray-800 tabular-nums bg-transparent focus:outline-none cursor-text caret-gray-400 selection:bg-gray-200 leading-none py-1"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    {timePresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setPresetTime(preset)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          totalSeconds === preset * 60
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {preset === 0 ? "∞m" : `${preset}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => onSelectAction(selectedFormat)}
          disabled={isLoading}
          className="bg-gray-900 hover:bg-gray-800 text-white h-14 px-10 text-base font-medium rounded-2xl shadow-lg shadow-gray-900/10 transition-all hover:shadow-xl hover:shadow-gray-900/15"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Start Session
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
