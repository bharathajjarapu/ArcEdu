"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/contexts/session";
import { useApp } from "@/contexts/app";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  X,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Trash2,
  Loader2,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quiz, Flashcard, Format, InputType, Chunk } from "@/types";
import * as sessions from "@/lib/storage/sessions";
import * as docs from "@/lib/storage/docs";
import * as cache from "@/lib/data/cache";
import { simple as simpleHash } from "@/lib/data/hash";
import { group } from "@/lib/process/batch";
import * as worker from "@/lib/process/worker";
import * as queue from "@/lib/process/queue";
import * as dedup from "@/lib/data/dedup";

async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload PDF");
  return response.json();
}

async function embedBatch(
  sessionId: string,
  texts: string[],
  hashes: string[],
) {
  const cached = await cache.getMany(sessionId, hashes);
  const needsApi: string[] = [];
  const needsApiHashes: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    if (!cached.has(hashes[i])) {
      needsApi.push(texts[i]);
      needsApiHashes.push(hashes[i]);
    }
  }

  if (needsApi.length > 0) {
    const dedupKey = `embed_${sessionId}_${needsApiHashes.join(",")}`;
    const data = await dedup.call(dedupKey, async () => {
      const response = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: needsApi }),
      });
      if (!response.ok) throw new Error("Failed to embed texts");
      return response.json();
    });

    for (let i = 0; i < needsApi.length; i++) {
      await cache.set(
        sessionId,
        needsApiHashes[i],
        data.embeddings[i].embedding,
      );
      cached.set(needsApiHashes[i], data.embeddings[i].embedding);
    }
  }

  return { embeddings: hashes.map((h) => ({ embedding: cached.get(h)! })) };
}

async function generateQuiz(
  topic: string,
  num: number,
  chunks?: any[],
): Promise<Quiz[]> {
  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, chunks }),
  });
  if (!response.ok) throw new Error("Failed to generate quiz");
  const data = await response.json();
  return data.quiz;
}

async function generateFlashcards(
  topic: string,
  num: number,
  chunks?: any[],
): Promise<Flashcard[]> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, num, chunks }),
  });
  if (!response.ok) throw new Error("Failed to generate flashcards");
  const data = await response.json();
  return data.flashcards;
}

async function generateTitle(content: string): Promise<string> {
  try {
    const response = await fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) return "New Session";
    const data = await response.json();
    return data.title || "New Session";
  } catch {
    return "New Session";
  }
}

export default function QuizApp() {
  const { current, all, setCurrent, create, remove, update, refresh } =
    useSession();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    worker.initWorkers();
    return () => worker.terminate();
  }, []);

  const [currentScreen, setCurrentScreen] = useState<
    "upload" | "format" | "quiz" | "flashcards" | "results"
  >("upload");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [inputType, setInputType] = useState<InputType>("docs");
  const [selectedFormat, setSelectedFormat] = useState<Format>("quiz");
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [flashcardAnswers, setFlashcardAnswers] = useState<
    Record<number, boolean>
  >({});

  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quizData, setQuizData] = useState<Quiz[]>([]);
  const [flashcardData, setFlashcardData] = useState<Flashcard[]>([]);

  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ id: string; name: string; size: string; chunks?: any[] }>
  >([]);
  const [allChunks, setAllChunks] = useState<any[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      let sessionId = activeSessionId;

      if (!sessionId) {
        const newSession = await create("New Session");
        sessionId = newSession.id;
        setActiveSessionId(sessionId);
        setCurrent(newSession);
      }

      const pdfQueue = queue.create(3);
      const newDocs = await pdfQueue.all(
        Array.from(files).map((file) => async () => {
          let content = "";
          try {
            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
              const pdfData = await uploadPDF(file);
              content = pdfData.text;
            } else if (
              file.type.startsWith("text/") ||
              file.name.endsWith(".txt")
            ) {
              content = await file.text();
            }
          } catch (err) {
            console.error("Error processing file:", err);
          }

          const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

          if (sessionId && content) {
            try {
              console.log(
                `Saving document: ${file.name}, sessionId: ${sessionId}`,
              );
              const doc = await docs.create(
                sessionId,
                file.name,
                size,
                content,
              );
              console.log(`Document saved with id: ${doc.id}`);

              const textChunks = await worker.chunkText(content);
              const chunks: Chunk[] = textChunks.map((text, index) => ({
                id: crypto.randomUUID(),
                sessionId: sessionId!,
                documentId: doc.id,
                text,
                embedding: [],
                index,
                hash: simpleHash(text),
              }));

              if (chunks.length > 0) {
                console.log(
                  `Saving ${chunks.length} chunks (no embeddings yet)`,
                );
                for (const chunk of chunks) {
                  await docs.saveChunks([chunk]);
                }
              }
            } catch (err) {
              console.error("Error saving document:", err);
            }
          }

          return {
            id: crypto.randomUUID(),
            name: file.name,
            size,
          };
        }),
      );

      setUploadedDocs((prev) => [...prev, ...newDocs]);

      if (sessionId && uploadedDocs.length === 0 && newDocs.length > 0) {
        const allContent = newDocs.map((d) => d.name).join(", ");
        const title = await generateTitle(allContent);
        await update(sessionId, { title });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload files");
    } finally {
      setIsLoading(false);
    }
  };

  const addLink = () => {
    if (currentLink.trim()) {
      setLinks((prev) => [...prev, currentLink.trim()]);
      setCurrentLink("");
    }
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    setError(null);

    if (inputType === "prompt" && !promptText.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (inputType === "docs" && uploadedDocs.length === 0) {
      setError("Please upload at least one document");
      return;
    }

    if (inputType === "links" && links.length === 0) {
      setError("Please add at least one link");
      return;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      const newSession = await create("New Session");
      sessionId = newSession.id;
      setActiveSessionId(sessionId);
      setCurrent(newSession);

      let contentForTitle = "";
      if (inputType === "prompt") {
        contentForTitle = promptText.substring(0, 100);
      } else if (inputType === "docs") {
        contentForTitle = uploadedDocs.map((d) => d.name).join(", ");
      } else if (inputType === "links") {
        contentForTitle = links[0];
      }

      if (contentForTitle) {
        const title = await generateTitle(contentForTitle);
        await update(sessionId, { title });
      }
    }

    setCurrentScreen("format");
  };

  const handleFormatSelect = async (format: Format) => {
    setSelectedFormat(format);
    setIsLoading(true);
    setError(null);

    if (!activeSessionId) {
      setError("No active session");
      setIsLoading(false);
      return;
    }

    try {
      let chunks = await sessions.getChunks(activeSessionId);

      if (!chunks || chunks.length === 0) {
        setError("No document content. Please upload documents first.");
        setIsLoading(false);
        return;
      }

      const needsEmbedding = chunks.filter(
        (c) => !c.embedding || c.embedding.length === 0,
      );

      if (needsEmbedding.length > 0) {
        console.log(`Embedding ${needsEmbedding.length} chunks in batches...`);
        const texts = needsEmbedding.map((c) => c.text);
        const hashes = needsEmbedding.map((c) => c.hash || simpleHash(c.text));

        const batches = group(texts, 10);
        const hashBatches = group(hashes, 10);
        let embedIndex = 0;

        for (let b = 0; b < batches.length; b++) {
          const { embeddings } = await embedBatch(
            activeSessionId,
            batches[b],
            hashBatches[b],
          );

          for (let i = 0; i < embeddings.length; i++) {
            needsEmbedding[embedIndex].embedding = embeddings[i].embedding;
            needsEmbedding[embedIndex].hash = hashBatches[b][i];
            await docs.saveChunks([needsEmbedding[embedIndex]]);
            embedIndex++;
          }
        }

        chunks = await sessions.getChunks(activeSessionId);
      }

      setAllChunks(chunks);
      if (format === "quiz") {
        const topicText =
          topic ||
          promptText ||
          uploadedDocs.map((d) => d.name).join(", ") ||
          "session content";
        const quiz = await generateQuiz(topicText, numQuestions, chunks);

        setQuizData(quiz);
        setCurrentScreen("quiz");
        setCurrentQuestion(0);
        setUserAnswers({});
        setSelectedAnswer(null);
        setShowFeedback(false);
        setQuizStartTime(Date.now());
        setQuestionStartTime(Date.now());
        setQuestionTimes([]);
        setCurrentStreak(0);
        setMaxStreak(0);
      } else {
        const topicText =
          topic ||
          promptText ||
          uploadedDocs.map((d) => d.name).join(", ") ||
          "session content";
        const flashcards = await generateFlashcards(
          topicText,
          numQuestions,
          chunks,
        );

        setFlashcardData(flashcards);
        setCurrentScreen("flashcards");
        setCurrentFlashcard(0);
        setIsFlashcardFlipped(false);
        setFlashcardAnswers({});
      }
    } catch (err) {
      setError("Failed to generate content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleContinueQuiz = () => {
    if (selectedAnswer) {
      const newAnswers = { ...userAnswers, [currentQuestion]: selectedAnswer };
      setUserAnswers(newAnswers);
      setShowFeedback(true);
      const questionTime = Date.now() - questionStartTime;
      setQuestionTimes((prev) => [...prev, questionTime]);

      const selectedIndex = selectedAnswer.charCodeAt(0) - 65;
      const isCorrect = selectedIndex === quizData[currentQuestion].answer;

      if (isCorrect) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setMaxStreak(Math.max(maxStreak, newStreak));
      } else {
        setCurrentStreak(0);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    } else {
      setCurrentScreen("results");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1] || null);
      setShowFeedback(false);
    }
  };

  const handleFlashcardScore = (gotIt: boolean) => {
    const newAnswers = { ...flashcardAnswers, [currentFlashcard]: gotIt };
    setFlashcardAnswers(newAnswers);
    if (currentFlashcard < flashcardData.length - 1) {
      setCurrentFlashcard(currentFlashcard + 1);
      setIsFlashcardFlipped(false);
    } else {
      setCurrentScreen("results");
    }
  };

  const handleFlashcardNext = () => {
    if (currentFlashcard < flashcardData.length - 1) {
      setCurrentFlashcard(currentFlashcard + 1);
      setIsFlashcardFlipped(false);
    }
  };

  const handleFlashcardPrevious = () => {
    if (currentFlashcard > 0) {
      setCurrentFlashcard(currentFlashcard - 1);
      setIsFlashcardFlipped(false);
    }
  };

  const calculateResults = () => {
    if (selectedFormat === "quiz") {
      const correctAnswers = Object.entries(userAnswers).filter(
        ([questionIndex, answer]) => {
          const selectedIndex = answer.charCodeAt(0) - 65;
          return (
            quizData[Number.parseInt(questionIndex)].answer === selectedIndex
          );
        },
      ).length;

      const totalQuestions = quizData.length;
      const accuracy =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;
      const totalTime = quizStartTime > 0 ? Date.now() - quizStartTime : 0;
      const fastestAnswer =
        questionTimes.length > 0 ? Math.min(...questionTimes) : 0;

      return {
        correctAnswers,
        totalQuestions,
        accuracy,
        totalTime,
        fastestAnswer,
        maxStreak,
      };
    } else {
      const correctAnswers = Object.values(flashcardAnswers).filter(
        (answer) => answer,
      ).length;
      const totalQuestions = flashcardData.length;
      const accuracy =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;

      return {
        correctAnswers,
        totalQuestions,
        accuracy,
        totalTime: 0,
        fastestAnswer: 0,
        maxStreak: 0,
      };
    }
  };

  const handleRetry = async () => {
    if (!activeSessionId) {
      setError("No active session");
      return;
    }

    setIsLoading(true);
    try {
      const chunks = await sessions.getChunks(activeSessionId);

      if (!chunks || chunks.length === 0) {
        setError("No document content available.");
        setIsLoading(false);
        return;
      }
      if (selectedFormat === "quiz") {
        const topicText =
          topic ||
          promptText ||
          uploadedDocs.map((d) => d.name).join(", ") ||
          "session content";
        const quiz = await generateQuiz(topicText, numQuestions, chunks);
        setQuizData(quiz);
        setCurrentScreen("quiz");
        setCurrentQuestion(0);
        setUserAnswers({});
        setSelectedAnswer(null);
        setShowFeedback(false);
        setQuizStartTime(Date.now());
        setQuestionStartTime(Date.now());
        setQuestionTimes([]);
        setCurrentStreak(0);
        setMaxStreak(0);
      } else {
        const topicText =
          topic ||
          promptText ||
          uploadedDocs.map((d) => d.name).join(", ") ||
          "session content";
        const flashcards = await generateFlashcards(
          topicText,
          numQuestions,
          chunks,
        );
        setFlashcardData(flashcards);
        setCurrentScreen("flashcards");
        setCurrentFlashcard(0);
        setIsFlashcardFlipped(false);
        setFlashcardAnswers({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQuiz = async () => {
    if (activeSessionId && current) {
      await update(activeSessionId, { completed: true });
    }

    setCurrent(null);
    setActiveSessionId(null);
    setCurrentScreen("upload");
    setUploadedDocs([]);
    setAllChunks([]);
    setLinks([]);
    setCurrentLink("");
    setPromptText("");
    setTopic("");
    setQuizData([]);
    setFlashcardData([]);
    setError(null);
    setInputType("docs");
    await refresh();
  };

  const handleSelectSession = async (session: any) => {
    setIsLoading(true);
    try {
      console.log(`=== Loading session: ${session.id} ===`);
      setCurrent(session);
      setActiveSessionId(session.id);

      const chunks = await sessions.getChunks(session.id);
      const docs = await sessions.getDocs(session.id);

      console.log(
        `Session ${session.id} loaded: ${chunks.length} chunks, ${docs.length} docs`,
      );
      console.log(
        `Documents:`,
        docs.map((d) => d.name),
      );
      console.log(`Chunks sample:`, chunks.slice(0, 2));

      setAllChunks(chunks);
      setUploadedDocs(
        docs.map((d) => ({
          id: d.id,
          name: d.name,
          size: d.size,
          chunks: [],
        })),
      );

      setQuizData([]);
      setFlashcardData([]);

      if (docs.length > 0) {
        setTopic(docs.map((d) => d.name).join(", "));
      }

      setCurrentScreen("format");
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm("Delete this session?")) {
      await remove(id);
      refresh();
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const getRelativeTime = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-dots">
      <header className="px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-800 rounded"></div>
            <span className="text-xl font-semibold text-gray-900">ArcEdu</span>
          </div>
          {currentScreen !== "upload" && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleNewQuiz}>
                <Plus className="w-4 h-4 mr-1" />
                New Session
              </Button>
            </div>
          )}
        </div>
      </header>

      {currentScreen === "upload" && (
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Quiz yourself on
              <br />
              anything
            </h1>
            <p className="text-gray-600 mb-8">
              Upload a PDF, slides, or paste a URL.
              <br />
              We'll handle the questions!
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-1 rounded-lg flex border border-gray-200">
              <button
                onClick={() => setInputType("prompt")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  inputType === "prompt"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                Prompt
              </button>
              <button
                onClick={() => setInputType("docs")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  inputType === "docs"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                Docs
              </button>
              <button
                onClick={() => setInputType("links")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  inputType === "links"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                Links
              </button>
            </div>
          </div>

          {inputType === "prompt" && (
            <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm border-gray-200">
              <textarea
                placeholder="Enter your prompt here..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
            </Card>
          )}

          {inputType === "docs" && (
            <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm border-gray-200">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 mb-6">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag & drop your files</p>
                <p className="text-sm text-gray-500 mb-4">or browse files</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={isLoading}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Browse Files"
                  )}
                </Button>
              </div>

              {uploadedDocs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Uploaded Documents:
                  </h4>
                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">{doc.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setUploadedDocs((prev) =>
                            prev.filter((d) => d.id !== doc.id),
                          )
                        }
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {inputType === "links" && (
            <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm border-gray-200">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  You can use YouTube Links and Doc Links
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={currentLink}
                    onChange={(e) => setCurrentLink(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLink()}
                    className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                  <Button
                    onClick={addLink}
                    disabled={!currentLink.trim()}
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {links.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Added Links:
                  </h4>
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="text-sm text-gray-900 truncate flex-1 mr-3">
                        {link}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(index)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="text-center mb-16">
            <Button
              onClick={handleContinue}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </div>

          {all.filter((s) => s.completed).length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Past Learning
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {all
                  .filter((s) => s.completed)
                  .map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 cursor-pointer hover:shadow-lg transition-all border-gray-200 bg-white/90"
                      onClick={() => handleSelectSession(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: session.color || "#e5e7eb",
                            }}
                          >
                            <Folder className="w-5 h-5 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {session.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {getRelativeTime(new Date(session.updatedAt))}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-gray-400" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentScreen === "format" && (
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
              onClick={() => setSelectedFormat("quiz")}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Quiz
                </h3>
                <p className="text-gray-600 text-sm">
                  Test your knowledge with multiple choice questions and get
                  instant feedback
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
              onClick={() => setSelectedFormat("flashcards")}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Flashcards
                </h3>
                <p className="text-gray-600 text-sm">
                  Study with interactive cards featuring terms and definitions
                  with flip animations
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
                onChange={(e) => setNumQuestions(Number(e.target.value))}
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
              onClick={() => handleFormatSelect(selectedFormat)}
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
      )}

      {currentScreen === "quiz" && quizData.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="text-gray-600 hover:bg-white/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-600">
              Question {currentQuestion + 1} of {quizData.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={currentQuestion === quizData.length - 1}
              className="text-gray-600 hover:bg-white/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">
              {quizData[currentQuestion].question}
            </h2>

            <div className="space-y-4 mb-8">
              {quizData[currentQuestion].options.map((option, index) => {
                const optionId = String.fromCharCode(65 + index);
                const isSelected = selectedAnswer === optionId;
                const isCorrect = index === quizData[currentQuestion].answer;
                const isIncorrect = showFeedback && isSelected && !isCorrect;
                const shouldShowCorrect = showFeedback && isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      !showFeedback && handleAnswerSelect(optionId)
                    }
                    disabled={showFeedback}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                      "flex items-center gap-4",
                      !showFeedback &&
                        !isSelected &&
                        "bg-white/90 backdrop-blur-sm border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                      !showFeedback &&
                        isSelected &&
                        "bg-gray-100 border-gray-400 shadow-md",
                      isIncorrect && "bg-red-50 border-red-300",
                      shouldShowCorrect && "bg-green-50 border-green-300",
                      showFeedback &&
                        !isIncorrect &&
                        !shouldShowCorrect &&
                        "bg-white/90 backdrop-blur-sm border-gray-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium flex-shrink-0",
                        !showFeedback &&
                          !isSelected &&
                          "border-gray-300 text-gray-600",
                        !showFeedback &&
                          isSelected &&
                          "border-gray-600 text-gray-700 bg-gray-200",
                        isIncorrect && "border-red-500 bg-red-500 text-white",
                        shouldShowCorrect &&
                          "border-green-500 bg-green-500 text-white",
                        showFeedback &&
                          !isIncorrect &&
                          !shouldShowCorrect &&
                          "border-gray-300 text-gray-600",
                      )}
                    >
                      {showFeedback ? (
                        isIncorrect ? (
                          <X className="w-4 h-4" />
                        ) : shouldShowCorrect ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          optionId
                        )
                      ) : (
                        optionId
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <Card className="p-6 mb-8 border-gray-200 bg-gray-50/90 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs">i</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Explanation:
                    </h3>
                    <p className="text-gray-700">
                      The correct answer is{" "}
                      {String.fromCharCode(
                        65 + quizData[currentQuestion].answer,
                      )}
                      :{" "}
                      {
                        quizData[currentQuestion].options[
                          quizData[currentQuestion].answer
                        ]
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="text-gray-600 hover:bg-white/50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {!showFeedback ? (
                <Button
                  onClick={handleContinueQuiz}
                  disabled={!selectedAnswer}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {currentQuestion === quizData.length - 1
                    ? "Finish"
                    : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {currentScreen === "flashcards" && flashcardData.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlashcardPrevious}
              disabled={currentFlashcard === 0}
              className="text-gray-600 hover:bg-white/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-600">
              Card {currentFlashcard + 1} of {flashcardData.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlashcardNext}
              disabled={currentFlashcard === flashcardData.length - 1}
              className="text-gray-600 hover:bg-white/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="perspective-1000 mb-8">
            <div
              className={cn(
                "relative w-full h-80 cursor-pointer transition-transform duration-700 transform-style-preserve-3d",
                isFlashcardFlipped && "rotate-y-180",
              )}
              onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
            >
              <Card className="absolute inset-0 w-full h-full backface-hidden bg-white/90 backdrop-blur-sm border-gray-200 flex items-center justify-center p-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {flashcardData[currentFlashcard].front}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Click to reveal definition
                  </p>
                </div>
              </Card>

              <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gray-100 backdrop-blur-sm border-gray-200 flex items-center justify-center p-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {flashcardData[currentFlashcard].front}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {flashcardData[currentFlashcard].back}
                  </p>
                  <p className="text-gray-500 text-sm mt-4">
                    Click to flip back
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {isFlashcardFlipped && (
            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={() => handleFlashcardScore(false)}
                variant="outline"
                className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Didn't Get It
              </Button>
              <Button
                onClick={() => handleFlashcardScore(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Got It
              </Button>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={handleFlashcardPrevious}
              disabled={currentFlashcard === 0}
              className="text-gray-600 hover:bg-white/50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <Button
              onClick={handleFlashcardNext}
              disabled={currentFlashcard === flashcardData.length - 1}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {currentScreen === "results" && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="text-8xl font-bold text-gray-900 mb-4">
              {calculateResults().correctAnswers}
              <span className="text-5xl text-gray-500">
                /{calculateResults().totalQuestions}
              </span>
            </div>
            <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
              Great job! You answered {calculateResults().correctAnswers} out of{" "}
              {calculateResults().totalQuestions} questions correctly — that's{" "}
              {calculateResults().accuracy}% accuracy!
            </p>

            {selectedFormat === "quiz" && (
              <div className="flex justify-center gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
                  <div className="text-sm text-gray-500 mb-2">Time taken</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(calculateResults().totalTime)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
                  <div className="text-sm text-gray-500 mb-2">
                    Fastest answer
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(calculateResults().fastestAnswer)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
                  <div className="text-sm text-gray-500 mb-2">
                    Question hotstreak
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {calculateResults().maxStreak}
                  </div>
                </div>
              </div>
            )}

            {selectedFormat === "flashcards" && (
              <div className="flex justify-center gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
                  <div className="text-sm text-gray-500 mb-2">
                    Correct answers
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {calculateResults().correctAnswers}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
                  <div className="text-sm text-gray-500 mb-2">
                    Total questions
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {calculateResults().totalQuestions}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 min-w-[140px]">
                  <div className="text-sm text-gray-500 mb-2">Accuracy</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {calculateResults().accuracy}%
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center mb-12">
              <div className="grid grid-cols-6 gap-3 justify-items-center mx-auto">
                {selectedFormat === "quiz"
                  ? quizData.map((question, index) => {
                      const userAnswer = userAnswers[index];
                      const selectedIndex = userAnswer
                        ? userAnswer.charCodeAt(0) - 65
                        : -1;
                      const isCorrect = selectedIndex === question.answer;
                      return (
                        <div
                          key={index}
                          className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
                            isCorrect ? "bg-green-500/80" : "bg-red-500/80",
                          )}
                        >
                          {isCorrect ? (
                            <Check className="w-6 h-6 text-white" />
                          ) : (
                            <X className="w-6 h-6 text-white" />
                          )}
                        </div>
                      );
                    })
                  : flashcardData.map((flashcard, index) => {
                      const gotIt = flashcardAnswers[index];
                      return (
                        <div
                          key={index}
                          className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
                            gotIt ? "bg-green-500/80" : "bg-red-500/80",
                          )}
                        >
                          {gotIt ? (
                            <ThumbsUp className="w-6 h-6 text-white" />
                          ) : (
                            <ThumbsDown className="w-6 h-6 text-white" />
                          )}
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-600 hover:bg-white/50 border border-gray-300"
              onClick={() => setCurrentScreen("format")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              variant="ghost"
              className="text-gray-600 hover:bg-white/50 border border-gray-300"
              onClick={handleNewQuiz}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
            <Button
              className="bg-gray-800 hover:bg-gray-900 text-white"
              disabled={isLoading}
              onClick={handleRetry}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
