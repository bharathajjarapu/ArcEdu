export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
  completed?: boolean;
}

export interface Document {
  id: string;
  sessionId: string;
  name: string;
  size: string;
  content: string;
  createdAt: number;
}

export interface Chunk {
  id: string;
  sessionId: string;
  documentId: string;
  text: string;
  embedding: number[];
  index: number;
  hash?: string;
}

export interface Cache {
  hash: string;
  sessionId: string;
  embedding: number[];
  createdAt: number;
}

export interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Notes {
  content: string;
}

export interface QuizAttempt {
  id: string;
  sessionId: string;
  quizData: Quiz[];
  answers: Record<number, string>;
  score: number;
  completedAt: number;
}

export interface FlashcardSession {
  id: string;
  sessionId: string;
  flashcards: Flashcard[];
  answers: Record<number, boolean>;
  completedAt: number;
}

export type Screen =
  | "sessions"
  | "upload"
  | "format"
  | "quiz"
  | "flashcards"
  | "notes"
  | "results";
export type InputType = "prompt" | "docs" | "links";
export type Format = "quiz" | "flashcards" | "notes";
export type Difficulty = "easy" | "medium" | "hard" | "adaptive";
export type NotesFormat = "summary" | "structured" | "exam" | "cheatsheet" | "prompt";
export type NotesLength = "short" | "medium" | "long" | "adaptive";
export type ContentDepth = "short" | "medium" | "long" | "auto";
export type DifficultyCurve = "fixed" | "progressive" | "adaptive";

export interface AppState {
  screen: Screen;
  loading: boolean;
  error: string | null;
}

export interface UploadState {
  inputType: InputType;
  promptText: string;
  links: string[];
  currentLink: string;
}

export interface QuizState {
  data: Quiz[];
  current: number;
  selected: string | null;
  answers: Record<number, string>;
  feedback: boolean;
  startTime: number;
  questionStart: number;
  times: number[];
  streak: number;
  maxStreak: number;
}

export interface FlashcardState {
  data: Flashcard[];
  current: number;
  flipped: boolean;
  answers: Record<number, boolean>;
}

export interface Progress {
  type: "upload" | "chunk" | "embed" | "generate";
  current: number;
  total: number;
  message?: string;
}
