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
  FileSearch,
  LayoutList,
  GraduationCap,
  ScrollText,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Format, Difficulty, NotesFormat, DifficultyCurve } from "@/types";

interface FormatProps {
  selectedFormat: Format;
  setSelectedFormatAction: (format: Format) => void;
  numQuestions: number;
  setNumQuestionsAction: (num: number) => void;
  difficulty: Difficulty;
  setDifficultyAction: (difficulty: Difficulty) => void;
  timeLimit: number;
  setTimeLimitAction: (minutes: number) => void;
  revealEnabled: boolean;
  setRevealEnabledAction: (enabled: boolean) => void;
  difficultyCurve: DifficultyCurve;
  setDifficultyCurveAction: (curve: DifficultyCurve) => void;
  uploadedDocs: Array<{ id: string; name: string; size: string }>;
  promptText: string;
  setPromptTextAction: (text: string) => void;
  notesFormat: NotesFormat;
  setNotesFormatAction: (format: NotesFormat) => void;
  codeEnabled: boolean;
  setCodeEnabledAction: (enabled: boolean) => void;
  formulasEnabled: boolean;
  setFormulasEnabledAction: (enabled: boolean) => void;
  diagramsEnabled: boolean;
  setDiagramsEnabledAction: (enabled: boolean) => void;
  tablesEnabled: boolean;
  setTablesEnabledAction: (enabled: boolean) => void;
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

const notesFormatConfig = {
  summary: {
    label: "Summary",
    icon: FileSearch,
    description: "Condensed overview",
  },
  structured: {
    label: "Structured",
    icon: LayoutList,
    description: "Organized sections",
  },
  exam: {
    label: "Exam",
    icon: GraduationCap,
    description: "Test preparation",
  },
  cheatsheet: {
    label: "Cheatsheet",
    icon: ScrollText,
    description: "Quick reference",
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
  timeLimit,
  setTimeLimitAction,
  revealEnabled,
  setRevealEnabledAction,
  difficultyCurve,
  setDifficultyCurveAction,
  uploadedDocs,
  promptText,
  setPromptTextAction,
  notesFormat,
  setNotesFormatAction,
  codeEnabled,
  setCodeEnabledAction,
  formulasEnabled,
  setFormulasEnabledAction,
  diagramsEnabled,
  setDiagramsEnabledAction,
  tablesEnabled,
  setTablesEnabledAction,
  error,
  isLoading,
  onSelectAction,
}: FormatProps) {
  const [totalSeconds, setTotalSeconds] = useState<number>(timeLimit * 60);
  const [minInput, setMinInput] = useState(String(Math.floor(timeLimit)).padStart(2, "0"));
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
    // Sync to parent (convert seconds to minutes)
    setTimeLimitAction(totalSeconds === 0 ? 0 : totalSeconds / 60);
  }, [totalSeconds, timeMinutes, timeSeconds, isEditingMin, isEditingSec, setTimeLimitAction]);

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

      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Setup your Learning
        </h1>
        <p className="mt-2 text-gray-700 text-xl font-medium leading-relaxed">
          How would you like to study ?
        </p>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-3 gap-3">
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

      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3">
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

          <div className="col-span-2 flex flex-col gap-3 h-[350px]">
            <textarea
              placeholder="Focus your learning — describe what topics or concepts to emphasize..."
              value={promptText}
              onChange={(e) => setPromptTextAction(e.target.value)}
              className={cn(
                "w-full px-4 py-3 text-sm bg-white font-semibold text-gray-500 focus:bg-gray-50 border-2 border-gray-200 focus:border-gray-300 rounded-xl transition-colors resize-none",
                selectedFormat === "notes" ? "h-24" : "flex-1"
              )}
            />

            {selectedFormat === "notes" ? (
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="flex flex-col bg-white rounded-xl border-2 border-gray-200 p-2 gap-1">
                  {(Object.keys(notesFormatConfig) as NotesFormat[]).map((format) => {
                    const config = notesFormatConfig[format];
                    const isActive = notesFormat === format;
                    const Icon = config.icon;

                    return (
                      <button
                        key={format}
                        onClick={() => setNotesFormatAction(format)}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3",
                          isActive
                            ? "bg-gray-900"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                          isActive ? "bg-white/10" : "bg-gray-100"
                        )}>
                          <Icon
                            className={cn(
                              "w-4 h-4",
                              isActive ? "text-white" : "text-gray-400"
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isActive ? "text-white" : "text-gray-700"
                            )}
                          >
                            {config.label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px]",
                              isActive ? "text-white/50" : "text-gray-400"
                            )}
                          >
                            •
                          </span>
                          <span
                            className={cn(
                              "text-[10px] truncate",
                              isActive ? "text-white/50" : "text-gray-400"
                            )}
                          >
                            {config.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Content Toggles - Right side 2x2 grid with larger icons, no bg */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Code Toggle */}
                  <button
                    onClick={() => setCodeEnabledAction(!codeEnabled)}
                    className={cn(
                      "rounded-xl border-2 p-3 transition-all duration-200 flex flex-col items-center justify-center gap-1.5",
                      codeEnabled
                        ? "bg-gray-900 border-gray-900"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className={cn(
                      "font-mono text-3xl font-bold leading-none",
                      codeEnabled ? "text-white" : "text-gray-400"
                    )}>
                      {"</>"}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold",
                      codeEnabled ? "text-white" : "text-gray-500"
                    )}>
                      Code
                    </span>
                  </button>

                  {/* Formulas Toggle */}
                  <button
                    onClick={() => setFormulasEnabledAction(!formulasEnabled)}
                    className={cn(
                      "rounded-xl border-2 p-3 transition-all duration-200 flex flex-col items-center justify-center gap-1.5",
                      formulasEnabled
                        ? "bg-gray-900 border-gray-900"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className={cn(
                      "text-3xl font-serif leading-none",
                      formulasEnabled ? "text-white" : "text-gray-400"
                    )}>
                      ∑
                    </span>
                    <span className={cn(
                      "text-xs font-semibold",
                      formulasEnabled ? "text-white" : "text-gray-500"
                    )}>
                      Formulas
                    </span>
                  </button>

                  {/* Diagrams Toggle */}
                  <button
                    onClick={() => setDiagramsEnabledAction(!diagramsEnabled)}
                    className={cn(
                      "rounded-xl border-2 p-3 transition-all duration-200 flex flex-col items-center justify-center gap-1.5",
                      diagramsEnabled
                        ? "bg-gray-900 border-gray-900"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <svg viewBox="0 0 24 24" className={cn("w-7 h-7", diagramsEnabled ? "text-white" : "text-gray-400")} fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="12" cy="18" r="3" />
                      <path d="M8.5 7.5L10.5 15.5M15.5 7.5L13.5 15.5" />
                    </svg>
                    <span className={cn(
                      "text-xs font-semibold",
                      diagramsEnabled ? "text-white" : "text-gray-500"
                    )}>
                      Diagrams
                    </span>
                  </button>

                  {/* Tables Toggle */}
                  <button
                    onClick={() => setTablesEnabledAction(!tablesEnabled)}
                    className={cn(
                      "rounded-xl border-2 p-3 transition-all duration-200 flex flex-col items-center justify-center gap-1.5",
                      tablesEnabled
                        ? "bg-gray-900 border-gray-900"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <svg viewBox="0 0 24 24" className={cn("w-7 h-7", tablesEnabled ? "text-white" : "text-gray-400")} fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                    </svg>
                    <span className={cn(
                      "text-xs font-semibold",
                      tablesEnabled ? "text-white" : "text-gray-500"
                    )}>
                      Tables
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz and Flashcards options: Difficulty, Questions, Time */
              <div className="flex-1 flex flex-col gap-3">
                {/* Difficulty + Reveal/Curve: Compact segmented controls */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Difficulty - Direct segmented control */}
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1 border-2 border-gray-300">
                    {(Object.keys(difficultyConfig) as Difficulty[]).map((level) => {
                      const config = difficultyConfig[level];
                      const isActive = difficulty === level;
                      return (
                        <button
                          key={level}
                          onClick={() => setDifficultyAction(level)}
                          className={cn(
                            "flex-1 py-4 px-1 rounded-lg text-xs font-semibold transition-all duration-200",
                            isActive
                              ? "bg-gray-900 text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-900 hover:bg-white"
                          )}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reveal (Quiz) or Curve (Flashcards) - Direct segmented control */}
                  {selectedFormat === "quiz" ? (
                    <button
                      onClick={() => setRevealEnabledAction(!revealEnabled)}
                      className="relative overflow-hidden rounded-xl bg-gray-100 border-2 border-gray-200 transition-all duration-300"
                    >
                      <div
                        className={cn(
                          "absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-gray-900 transition-all duration-300 ease-out shadow-sm",
                          revealEnabled ? "left-1" : "left-[calc(50%+2px)]"
                        )}
                      />
                      <div className="relative flex h-full">
                        <div
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors duration-200 z-10",
                            revealEnabled ? "text-white" : "text-gray-500"
                          )}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Reveal Ans</span>
                        </div>
                        <div
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors duration-200 z-10",
                            !revealEnabled ? "text-white" : "text-gray-500"
                          )}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Hide Ans</span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1 border-2 border-gray-200">
                      {(["fixed", "progressive", "adaptive"] as DifficultyCurve[]).map((curve) => {
                        const isActive = difficultyCurve === curve;
                        return (
                          <button
                            key={curve}
                            onClick={() => setDifficultyCurveAction(curve)}
                            className={cn(
                              "flex-1 py-2 px-1 rounded-lg transition-all duration-200 flex flex-col items-center gap-0.5",
                              isActive
                                ? "bg-gray-900 shadow-sm"
                                : "hover:bg-white"
                            )}
                          >
                            <svg
                              viewBox="0 0 40 20"
                              className={cn(
                                "w-7 h-3.5",
                                isActive ? "text-white" : "text-gray-400"
                              )}
                              fill="none"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                            >
                              {curve === "fixed" && <path d="M2 14 L38 14" />}
                              {curve === "progressive" && <path d="M2 16 Q10 16 20 10 T38 4" />}
                              {curve === "adaptive" && <path d="M2 14 Q8 14 12 8 Q16 2 20 10 Q24 18 28 6 Q32 2 38 4" />}
                            </svg>
                            <span
                              className={cn(
                                "text-[10px] font-semibold capitalize",
                                isActive ? "text-white" : "text-gray-500"
                              )}
                            >
                              {curve}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3">
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

                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 relative">
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
            )}
          </div>
        </div>
      </div>

      {
        error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )
      }

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
    </div >
  );
}
