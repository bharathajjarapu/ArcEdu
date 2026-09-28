export type Format = "quiz" | "notes" | "slides";
export type Palette = "minimal" | "dark" | "colorful" | "ocean" | "forest" | "sunset" | "purple";

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// A span of a document's markdown, with its embedding once indexed.
export interface Chunk {
  start: number;
  end: number;
  vector?: Float32Array;
}

export interface Doc {
  id: string;
  sessionId: string;
  name: string;
  size: string;
  content: string;
  createdAt: number;
  chunks?: Chunk[];
}

// Saved notes or slides.
export interface Saved {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

// A quiz run: live while playing, stored once finished.
export interface Play {
  questions: Question[];
  index: number;
  answers: Record<number, number>;
  start: number;
  shown: number;
  end: number;
  times: number[];
  streak: number;
  best: number;
}

export interface Attempt extends Play {
  id: string;
  sessionId: string;
}

export interface Options {
  format: Format;
  prompt: string;
  questions: number;
  difficulty: string;
  minutes: number;
  reveal: boolean;
  style: string;
  length: string;
  extras: string[];
  slides: number;
  design: string;
  palette: Palette;
  speaker: boolean;
}
