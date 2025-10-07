export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
  completed?: boolean;
  lastFormat?: Format;
  notesContent?: string;
  slidesContent?: string;
  slideIndex?: number;
}

export interface SavedNotes {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface SavedSlides {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  createdAt: number;
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

export interface ChatSource {
  sessionId: string;
  sessionTitle: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  sources?: ChatSource[];
}

export interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
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
  totalTime?: number;
  questionTimes?: number[];
  maxStreak?: number;
}

export type InputType = "prompt" | "docs" | "links";
export type Format = "quiz" | "notes" | "slides";
export type Difficulty = "easy" | "medium" | "hard" | "adaptive";
export type NotesFormat = "summary" | "structured" | "exam" | "cheatsheet" | "prompt";
export type NotesLength = "short" | "medium" | "long" | "adaptive";
export type SlideDesign = "minimal" | "professional" | "colorful" | "academic" | "creative" | "dark" | "technical" | "visual";
export type SlideColorPalette = "minimal" | "dark" | "colorful" | "ocean" | "forest" | "sunset" | "purple";



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

export interface Progress {
  type: "upload" | "chunk" | "embed" | "generate";
  current: number;
  total: number;
  message?: string;
}
