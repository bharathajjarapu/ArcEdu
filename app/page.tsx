"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/contexts/session";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz, Flashcard, Format, InputType, Chunk } from "@/types";
import * as sessions from "@/lib/storage/sessions";
import * as docs from "@/lib/storage/docs";
import * as cache from "@/lib/data/cache";
import { simple as simpleHash } from "@/lib/data/hash";
import { group } from "@/lib/process/batch";
import * as worker from "@/lib/process/worker";
import * as queue from "@/lib/process/queue";
import {
  embedBatch,
  generateQuiz,
  generateFlashcards,
  generateTitle,
} from "@/lib/client";
import { Upload } from "@/components/screens/upload";
import { Format as FormatScreen } from "@/components/screens/format";
import { QuizScreen } from "@/components/screens/quiz";
import { Flashcards } from "@/components/screens/flashcards";
import { Results } from "@/components/screens/results";

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
    Array<{ id: string; name: string; size: string }>
  >([]);
  const [allChunks, setAllChunks] = useState<any[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState("");

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
    }

    const currentSession = current || (await sessions.getById(sessionId));
    if (currentSession && currentSession.title === "New Session") {
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
      const nextQ = currentQuestion + 1;
      setCurrentQuestion(nextQ);
      setSelectedAnswer(userAnswers[nextQ] || null);
      setShowFeedback(!!userAnswers[nextQ]);
      setQuestionStartTime(Date.now());
    } else {
      setCurrentScreen("results");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQ = currentQuestion - 1;
      setCurrentQuestion(prevQ);
      setSelectedAnswer(userAnswers[prevQ] || null);
      setShowFeedback(!!userAnswers[prevQ]);
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
      setCurrent(session);
      setActiveSessionId(session.id);

      const chunks = await sessions.getChunks(session.id);
      const docsData = await sessions.getDocs(session.id);

      setAllChunks(chunks);
      setUploadedDocs(
        docsData.map((d) => ({
          id: d.id,
          name: d.name,
          size: d.size,
        })),
      );

      setQuizData([]);
      setFlashcardData([]);

      if (docsData.length > 0) {
        setTopic(docsData.map((d) => d.name).join(", "));
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewQuiz}
                className="border border-gray-200 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Session
              </Button>
            </div>
          )}
        </div>
      </header>

      {currentScreen === "upload" && (
        <Upload
          inputType={inputType}
          setInputTypeAction={setInputType}
          promptText={promptText}
          setPromptTextAction={setPromptText}
          uploadedDocs={uploadedDocs}
          setUploadedDocsAction={setUploadedDocs}
          links={links}
          setLinksAction={setLinks}
          currentLink={currentLink}
          setCurrentLinkAction={setCurrentLink}
          error={error}
          setErrorAction={setError}
          isLoading={isLoading}
          setIsLoadingAction={setIsLoading}
          activeSessionId={activeSessionId}
          onCreateAction={async (title) => {
            const session = await create(title);
            setActiveSessionId(session.id);
            setCurrent(session);
            return session;
          }}
          onUpdateSessionAction={async (id, data) => {
            await update(id, data);
          }}
          onContinueAction={handleContinue}
          all={all}
          onSelectSessionAction={handleSelectSession}
          onDeleteSessionAction={handleDeleteSession}
        />
      )}

      {currentScreen === "format" && (
        <FormatScreen
          selectedFormat={selectedFormat}
          setSelectedFormatAction={setSelectedFormat}
          numQuestions={numQuestions}
          setNumQuestionsAction={setNumQuestions}
          error={error}
          isLoading={isLoading}
          onSelectAction={handleFormatSelect}
        />
      )}

      {currentScreen === "quiz" && quizData.length > 0 && (
        <QuizScreen
          quizData={quizData}
          currentQuestion={currentQuestion}
          selectedAnswer={selectedAnswer}
          userAnswers={userAnswers}
          showFeedback={showFeedback}
          onAnswerSelectAction={handleAnswerSelect}
          onContinueAction={handleContinueQuiz}
          onNextAction={handleNext}
          onPreviousAction={handlePrevious}
        />
      )}

      {currentScreen === "flashcards" && flashcardData.length > 0 && (
        <Flashcards
          flashcardData={flashcardData}
          currentFlashcard={currentFlashcard}
          isFlashcardFlipped={isFlashcardFlipped}
          onFlipAction={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
          onScoreAction={handleFlashcardScore}
          onNextAction={handleFlashcardNext}
          onPreviousAction={handleFlashcardPrevious}
        />
      )}

      {currentScreen === "results" && (
        <Results
          selectedFormat={selectedFormat}
          quizData={quizData}
          flashcardData={flashcardData}
          userAnswers={userAnswers}
          flashcardAnswers={flashcardAnswers}
          totalTime={quizStartTime > 0 ? Date.now() - quizStartTime : 0}
          fastestAnswer={
            questionTimes.length > 0 ? Math.min(...questionTimes) : 0
          }
          maxStreak={maxStreak}
          onGoBackAction={() => setCurrentScreen("format")}
          onNewSessionAction={handleNewQuiz}
          onRetryAction={handleRetry}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
