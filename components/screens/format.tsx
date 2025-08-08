"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  HelpCircle,
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
  MessageCircle,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Format, Difficulty, NotesFormat, NotesLength, DifficultyCurve, SlideColorPalette } from "@/types";

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
  notesLength: NotesLength;
  setNotesLengthAction: (length: NotesLength) => void;
  numSlides: number;
  setNumSlidesAction: (num: number) => void;
  slideDesign: string;
  setSlideDesignAction: (design: string) => void;
  slideColorPalette: SlideColorPalette;
  setSlideColorPaletteAction: (palette: SlideColorPalette) => void;
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
  prompt: {
    label: "Prompt",
    icon: MessageCircle,
    description: "Custom prompt",
  },
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

const notesLengthConfig = {
  short: {
    label: "Short",
    description: "Brief & concise",
  },
  medium: {
    label: "Medium",
    description: "Balanced depth",
  },
  long: {
    label: "Long",
    description: "Comprehensive",
  },
  adaptive: {
    label: "Adaptive",
    description: "Smart length",
  },
};

const slideDesignConfig = [
  { id: "professional", name: "Professional" },
  { id: "academic", name: "Academic" },
  { id: "creative", name: "Creative" },
  { id: "technical", name: "Technical" },
  { id: "visual", name: "Visual" },
];

const colorPaletteConfig: { id: SlideColorPalette; name: string; dot: string; preview: string }[] = [
  { id: "minimal", name: "Minimal", dot: "bg-gray-200", preview: "bg-gradient-to-br from-gray-100 to-gray-200" },
  { id: "dark", name: "Dark", dot: "bg-zinc-800", preview: "bg-gradient-to-br from-zinc-900 to-zinc-700" },
  { id: "colorful", name: "Colorful", dot: "bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400", preview: "bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400" },
  { id: "ocean", name: "Ocean", dot: "bg-gradient-to-br from-blue-600 to-cyan-500", preview: "bg-gradient-to-br from-blue-600 to-cyan-500" },
  { id: "forest", name: "Forest", dot: "bg-gradient-to-br from-emerald-700 to-green-500", preview: "bg-gradient-to-br from-emerald-700 to-green-500" },
  { id: "sunset", name: "Sunset", dot: "bg-gradient-to-br from-orange-500 to-rose-500", preview: "bg-gradient-to-br from-orange-500 to-rose-500" },
  { id: "purple", name: "Purple", dot: "bg-gradient-to-br from-purple-700 to-indigo-600", preview: "bg-gradient-to-br from-purple-700 to-indigo-600" },
];

const questionPresets = [3, 5, 10, 15, 20, 25, 30];
const timePresets = [0, 3, 5, 10, 20];
const slidesPresets = [5, 10, 15, 20, 25, 30];

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
  notesLength,
  setNotesLengthAction,
  numSlides,
  setNumSlidesAction,
  slideDesign,
  setSlideDesignAction,
  slideColorPalette,
  setSlideColorPaletteAction,
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

  // Slide design carousel state
  const currentDesignIndex = slideDesignConfig.findIndex((d) => d.id === slideDesign);
  const currentDesign = slideDesignConfig[currentDesignIndex] || slideDesignConfig[0];
  const currentPalette = colorPaletteConfig.find((p) => p.id === slideColorPalette) || colorPaletteConfig[2];

  const handlePrevDesign = () => {
    const newIndex = currentDesignIndex <= 0 ? slideDesignConfig.length - 1 : currentDesignIndex - 1;
    setSlideDesignAction(slideDesignConfig[newIndex].id);
  };

  const handleNextDesign = () => {
    const newIndex = currentDesignIndex >= slideDesignConfig.length - 1 ? 0 : currentDesignIndex + 1;
    setSlideDesignAction(slideDesignConfig[newIndex].id);
  };

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
            onClick={() => setSelectedFormatAction("slides")}
            className={cn(
              "group relative p-5 rounded-2xl border-2 transition-all duration-200 text-left",
              selectedFormat === "slides"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                selectedFormat === "slides" ? "bg-white/10" : "bg-gray-100"
              )}
            >
              <Presentation
                className={cn(
                  "w-5 h-5",
                  selectedFormat === "slides" ? "text-white" : "text-gray-600"
                )}
              />
            </div>
            <h3 className="text-lg font-semibold mb-1">Slides</h3>
            <p
              className={cn(
                "text-sm leading-relaxed",
                selectedFormat === "slides" ? "text-gray-300" : "text-gray-500"
              )}
            >
              Presentation slides
            </p>
            {selectedFormat === "slides" && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white" />
            )}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-2 border-gray-100 shrink-0">
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
                            <span className="text-xs text-gray-400 shrink-0">•</span>
                            <span className="text-xs font-semibold text-gray-400 shrink-0">{doc.size}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-400 uppercase shrink-0">{fileExt}</span>
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
              className="w-full flex-1 px-4 py-3 text-sm bg-white font-semibold text-gray-500 focus:bg-gray-50 border-2 border-gray-200 focus:border-gray-300 rounded-xl transition-colors resize-none"
            />

            {selectedFormat === "notes" ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1 border-2 border-gray-300">
                    {(["short", "medium", "long", "adaptive"] as NotesLength[]).map((length) => {
                      const isActive = notesLength === length;
                      return (
                        <button
                          key={length}
                          onClick={() => setNotesLengthAction(length)}
                          className={cn(
                            "flex-1 py-4 px-1 rounded-lg text-xs font-semibold transition-all duration-200 capitalize",
                            isActive
                              ? "bg-gray-900 text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-900 hover:bg-white"
                          )}
                        >
                          {length}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex bg-gray-100 rounded-xl gap-1 border-2 border-gray-300 p-1">
                    <button
                      onClick={() => setCodeEnabledAction(!codeEnabled)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 leading-none",
                        codeEnabled
                          ? "bg-gray-900 text-white shadow-sm border-gray-900"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-white"
                      )}
                      onFocus={(e) => e.currentTarget.classList.add("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                      onBlur={(e) => e.currentTarget.classList.remove("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                    >
                      <span className="font-mono text-base font-bold leading-none">{"</>"}</span>
                      <span className="text-[10px] leading-none">Code</span>
                    </button>
                    <button
                      onClick={() => setFormulasEnabledAction(!formulasEnabled)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 leading-none",
                        formulasEnabled
                          ? "bg-gray-900 text-white shadow-sm border-gray-900"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-white"
                      )}
                      onFocus={(e) => e.currentTarget.classList.add("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                      onBlur={(e) => e.currentTarget.classList.remove("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                    >
                      <span className="text-base font-serif leading-none">∑</span>
                      <span className="text-[10px] leading-none">Formulas</span>
                    </button>
                    <button
                      onClick={() => setDiagramsEnabledAction(!diagramsEnabled)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 leading-none",
                        diagramsEnabled
                          ? "bg-gray-900 text-white shadow-sm border-gray-900"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-white"
                      )}
                      onFocus={(e) => e.currentTarget.classList.add("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                      onBlur={(e) => e.currentTarget.classList.remove("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="18" cy="6" r="3" />
                        <circle cx="12" cy="18" r="3" />
                        <path d="M8.5 7.5L10.5 15.5M15.5 7.5L13.5 15.5" />
                      </svg>
                      <span className="text-[10px] leading-none">Diagrams</span>
                    </button>
                    <button
                      onClick={() => setTablesEnabledAction(!tablesEnabled)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 leading-none",
                        tablesEnabled
                          ? "bg-gray-900 text-white shadow-sm border-gray-900"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-white"
                      )}
                      onFocus={(e) => e.currentTarget.classList.add("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                      onBlur={(e) => e.currentTarget.classList.remove("ring-1", "ring-gray-200", "ring-offset-1", "ring-offset-gray-100")}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                      </svg>
                      <span className="text-[10px] leading-none">Tables</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-2xl p-3 h-35">
                  <div className="flex gap-2 h-full">
                    {(Object.keys(notesFormatConfig) as NotesFormat[]).map((format) => {
                      const config = notesFormatConfig[format];
                      const isActive = notesFormat === format;
                      const Icon = config.icon;

                      return (
                        <button
                          key={format}
                          onClick={() => setNotesFormatAction(format)}
                          className={cn(
                            "flex-1 rounded-xl border-2 p-2 transition-all duration-200 flex flex-col items-center justify-center gap-1",
                            isActive
                              ? "bg-gray-900 border-gray-900"
                              : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                            isActive ? "bg-white/10" : "bg-gray-100"
                          )}>
                            <Icon
                              className={cn(
                                "w-4 h-4",
                                isActive ? "text-white" : "text-gray-400"
                              )}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] font-semibold",
                              isActive ? "text-white" : "text-gray-700"
                            )}
                          >
                            {config.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : selectedFormat === "slides" ? (
              <div className="flex-1 grid grid-cols-2 gap-3">
                {/* Left Column - Color Palette + Slide Counter */}
                <div className="flex flex-col gap-3">
                  {/* Color Palette */}
                  <div className="flex bg-gray-100 rounded-xl gap-2 border-2 border-gray-300 py-4 px-3 items-center justify-center">
                    {colorPaletteConfig.map((palette) => (
                      <button
                        key={palette.id}
                        onClick={() => setSlideColorPaletteAction(palette.id)}
                        className="p-0.5 px-2 rounded-full transition-all duration-200 hover:scale-105"
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full transition-all duration-200",
                            palette.dot,
                            slideColorPalette === palette.id
                              ? "ring-2 ring-offset-2 ring-gray-900"
                              : "hover:ring-2 hover:ring-offset-1 hover:ring-gray-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Slide Counter */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex-1">
                    <div className="flex justify-between mb-4 h-14 items-start pt-1">
                      <button
                        onClick={() => setNumSlidesAction(Math.max(1, numSlides - 1))}
                        disabled={numSlides <= 1}
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-gray-900 tabular-nums leading-none">{numSlides}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">slides</span>
                      </div>
                      <button
                        onClick={() => setNumSlidesAction(Math.min(50, numSlides + 1))}
                        disabled={numSlides >= 50}
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {slidesPresets.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setNumSlidesAction(preset)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            numSlides === preset ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Slide Design */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={handlePrevDesign}
                      className="w-9 h-9 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <h4 className="text-sm font-bold text-gray-900">{currentDesign.name}</h4>
                    <button
                      onClick={handleNextDesign}
                      className="w-9 h-9 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className={cn("w-full h-32 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden", currentPalette.preview)}>
                      {/* Slide illustration - unique per format */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {currentDesign.id === "professional" && (
                          <div className={cn(
                            "w-36 h-20 rounded-lg flex flex-col p-2.5",
                            slideColorPalette === "minimal" ? "bg-white/90" : "bg-white/20"
                          )}>
                            {/* Professional: Clean header + bullet points + chart */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn("w-4 h-4 rounded", slideColorPalette === "minimal" ? "bg-gray-800" : "bg-white/60")} />
                              <div className={cn("flex-1 h-2 rounded-full", slideColorPalette === "minimal" ? "bg-gray-700" : "bg-white/50")} />
                            </div>
                            <div className="flex flex-1 gap-2">
                              <div className="flex-1 flex flex-col gap-1">
                                <div className={cn("w-full h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-400" : "bg-white/40")} />
                                <div className={cn("w-4/5 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                                <div className={cn("w-3/5 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                              </div>
                              <div className="w-10 flex items-end gap-0.5">
                                <div className={cn("w-2 h-4 rounded-t", slideColorPalette === "minimal" ? "bg-gray-400" : "bg-white/40")} />
                                <div className={cn("w-2 h-6 rounded-t", slideColorPalette === "minimal" ? "bg-gray-500" : "bg-white/50")} />
                                <div className={cn("w-2 h-5 rounded-t", slideColorPalette === "minimal" ? "bg-gray-400" : "bg-white/40")} />
                              </div>
                            </div>
                          </div>
                        )}
                        {currentDesign.id === "academic" && (
                          <div className={cn(
                            "w-36 h-20 rounded-lg flex flex-col p-2.5",
                            slideColorPalette === "minimal" ? "bg-white/90" : "bg-white/20"
                          )}>
                            {/* Academic: Title + numbered list + formula */}
                            <div className={cn("w-3/4 h-2 rounded-full mb-2", slideColorPalette === "minimal" ? "bg-gray-800" : "bg-white/60")} />
                            <div className="flex-1 flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className={cn("text-[6px] font-bold", slideColorPalette === "minimal" ? "text-gray-600" : "text-white/60")}>1.</span>
                                <div className={cn("flex-1 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={cn("text-[6px] font-bold", slideColorPalette === "minimal" ? "text-gray-600" : "text-white/60")}>2.</span>
                                <div className={cn("flex-1 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                              </div>
                            </div>
                            <div className={cn("self-center px-2 py-0.5 rounded text-[7px] font-serif italic", slideColorPalette === "minimal" ? "bg-gray-100 text-gray-600" : "bg-white/10 text-white/70")}>
                              E = mc²
                            </div>
                          </div>
                        )}
                        {currentDesign.id === "creative" && (
                          <div className={cn(
                            "w-36 h-20 rounded-lg flex p-2.5 gap-2",
                            slideColorPalette === "minimal" ? "bg-white/90" : "bg-white/20"
                          )}>
                            {/* Creative: Asymmetric layout with shapes */}
                            <div className="flex-1 flex flex-col justify-center gap-1">
                              <div className={cn("w-full h-2.5 rounded-full", slideColorPalette === "minimal" ? "bg-gray-800" : "bg-white/60")} />
                              <div className={cn("w-2/3 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-400" : "bg-white/40")} />
                              <div className={cn("w-1/2 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                            </div>
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <div className={cn("w-6 h-6 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                              <div className={cn("w-4 h-4 rotate-45", slideColorPalette === "minimal" ? "bg-gray-400" : "bg-white/40")} />
                            </div>
                          </div>
                        )}
                        {currentDesign.id === "technical" && (
                          <div className={cn(
                            "w-36 h-20 rounded-lg flex flex-col p-2.5",
                            slideColorPalette === "minimal" ? "bg-white/90" : "bg-white/20"
                          )}>
                            {/* Technical: Code block + diagram */}
                            <div className={cn("w-1/2 h-1.5 rounded-full mb-1.5", slideColorPalette === "minimal" ? "bg-gray-700" : "bg-white/50")} />
                            <div className={cn("flex-1 rounded p-1 font-mono text-[5px] leading-tight", slideColorPalette === "minimal" ? "bg-gray-900 text-green-400" : "bg-black/30 text-green-300")}>
                              <div>{"function() {"}</div>
                              <div className="pl-1">{"return x;"}</div>
                              <div>{"}"}</div>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <div className={cn("w-3 h-3 rounded border", slideColorPalette === "minimal" ? "border-gray-400" : "border-white/40")} />
                              <div className={cn("w-2 h-0.5", slideColorPalette === "minimal" ? "bg-gray-400" : "bg-white/40")} />
                              <div className={cn("w-3 h-3 rounded border", slideColorPalette === "minimal" ? "border-gray-400" : "border-white/40")} />
                            </div>
                          </div>
                        )}
                        {currentDesign.id === "visual" && (
                          <div className={cn(
                            "w-36 h-20 rounded-lg flex p-2 gap-2",
                            slideColorPalette === "minimal" ? "bg-white/90" : "bg-white/20"
                          )}>
                            {/* Visual: Large image placeholder + minimal text */}
                            <div className={cn("w-16 h-full rounded flex items-center justify-center", slideColorPalette === "minimal" ? "bg-gray-200" : "bg-white/20")}>
                              <svg viewBox="0 0 24 24" className={cn("w-6 h-6", slideColorPalette === "minimal" ? "text-gray-400" : "text-white/40")} fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-1">
                              <div className={cn("w-full h-1.5 rounded-full", slideColorPalette === "minimal" ? "bg-gray-700" : "bg-white/50")} />
                              <div className={cn("w-4/5 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                              <div className={cn("w-3/5 h-1 rounded-full", slideColorPalette === "minimal" ? "bg-gray-300" : "bg-white/30")} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
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

                  {selectedFormat === "quiz" && (
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
