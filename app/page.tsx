"use client";

import { useEffect, lazy, Suspense, memo } from "react";
import { useSession } from "@/contexts/session";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as sessions from "@/lib/storage/sessions";
import * as worker from "@/lib/process/worker";
import { generateTitle } from "@/lib/api/client";
import { useQuiz } from "@/hooks/quiz";
import { useFlash } from "@/hooks/flash";
import { useScreen } from "@/hooks/screen"; // Renamed from useUI
import { useContent } from "@/hooks/content";
import { useUpload } from "@/hooks/upload";
import type { Format, Quiz, Flashcard } from "@/types";

// Lazy load screen components
const Upload = lazy(() => import("@/components/screens/upload").then((m) => ({ default: m.Upload })));
const Sessions = lazy(() => import("@/components/screens/sessions").then((m) => ({ default: m.Sessions })));
const FormatScreen = lazy(() => import("@/components/screens/format").then((m) => ({ default: m.Format })));
const QuizScreen = lazy(() => import("@/components/screens/quiz").then((m) => ({ default: m.QuizScreen })));
const Flashcards = lazy(() => import("@/components/screens/flashcards").then((m) => ({ default: m.Flashcards })));
const Results = lazy(() => import("@/components/screens/results").then((m) => ({ default: m.Results })));

// Memoized components to prevent unnecessary re-renders
const MemoizedQuizScreen = memo(QuizScreen);
const MemoizedFlashcards = memo(Flashcards);

export default function QuizApp() {
  const { current, all, setCurrent, create, remove, update, refresh } = useSession();
  const screen = useScreen();
  const quiz = useQuiz();
  const flash = useFlash();
  const { generateQuizContent, generateFlashcardContent } = useContent();
  const { validate, getTopicText } = useUpload();

  // Initialize workers once on mount
  useEffect(() => {
    worker.initWorkers();
    return () => worker.terminate();
  }, []);

  const handleContinue = async () => {
    screen.setError(null);

    const error = validate({
      inputType: screen.inputType,
      promptText: screen.promptText,
      uploadedDocs: screen.uploadedDocs,
      links: screen.links,
    });

    if (error) {
      screen.setError(error);
      return;
    }

    let sessionId: string;
    let currentSession = current;

    if (!current) {
      const newSession = await create("New Session");
      sessionId = newSession.id;
      currentSession = newSession;
      setCurrent(newSession);
    } else {
      sessionId = current.id;
    }

    if (currentSession?.title === "New Session") {
      const content = screen.inputType === "prompt"
        ? screen.promptText.substring(0, 100)
        : screen.inputType === "docs"
          ? screen.uploadedDocs.map((d) => d.name).join(", ")
          : screen.links[0];

      if (content) {
        const title = await generateTitle(content);
        await update(sessionId, { title });
      }
    }

    screen.setScreen("format");
  };

  const handleFormatSelect = async (format: Format) => {
    screen.setSelectedFormat(format);
    screen.setIsLoading(true);
    screen.setError(null);

    if (!current) {
      screen.setError("No active session");
      screen.setIsLoading(false);
      return;
    }

    try {
      const topicText = getTopicText(
        screen.topic,
        screen.promptText,
        screen.uploadedDocs,
        screen.links
      );

      if (format === "quiz") {
        quiz.startQuiz();
        let first = true;

        await generateQuizContent({
          sessionId: current.id,
          topic: topicText,
          numQuestions: screen.numQuestions,
          onProgress: (item) => {
            quiz.setQuizData(prev => [...prev, item as Quiz]);
            if (first) {
              screen.setScreen("quiz");
              first = false;
            }
          },
        });
      } else {
        flash.startFlashcards();
        let first = true;

        await generateFlashcardContent({
          sessionId: current.id,
          topic: topicText,
          numQuestions: screen.numQuestions,
          onProgress: (item) => {
            flash.setFlashcardData(prev => [...prev, item as Flashcard]);
            if (first) {
              screen.setScreen("flashcards");
              first = false;
            }
          },
        });
      }
    } catch (err) {
      screen.setError("Failed to generate content");
    } finally {
      screen.setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!current) {
      screen.setError("No active session");
      return;
    }

    screen.setIsLoading(true);
    try {
      const topicText = getTopicText(
        screen.topic,
        screen.promptText,
        screen.uploadedDocs,
        screen.links
      );

      if (screen.selectedFormat === "quiz") {
        quiz.startQuiz();
        let first = true;

        await generateQuizContent({
          sessionId: current.id,
          topic: topicText,
          numQuestions: screen.numQuestions,
          onProgress: (item) => {
            quiz.setQuizData(prev => [...prev, item as Quiz]);
            if (first) {
              screen.setScreen("quiz");
              first = false;
            }
          },
        });
      } else {
        flash.startFlashcards();
        let first = true;

        await generateFlashcardContent({
          sessionId: current.id,
          topic: topicText,
          numQuestions: screen.numQuestions,
          onProgress: (item) => {
            flash.setFlashcardData(prev => [...prev, item as Flashcard]);
            if (first) {
              screen.setScreen("flashcards");
              first = false;
            }
          },
        });
      }
    } finally {
      screen.setIsLoading(false);
    }
  };

  const handleNewQuiz = async () => {
    if (current) {
      await update(current.id, { completed: true });
    }
    setCurrent(null);
    screen.reset();
    quiz.startQuiz();
    flash.startFlashcards();
    await refresh();
  };

  const handleSelectSession = async (session: any) => {
    screen.setIsLoading(true);
    try {
      setCurrent(session);
      const docsData = await sessions.getDocs(session.id);

      screen.setUploadedDocs(docsData.map((d) => ({ id: d.id, name: d.name, size: d.size })));

      if (docsData.length > 0) {
        screen.setTopic(docsData.map((d) => d.name).join(", "));
      }

      screen.setScreen("format");
    } catch (err) {
      screen.setError("Failed to load session");
    } finally {
      screen.setIsLoading(false);
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
            <span className="text-xl font-semibold tracking-tight text-gray-900">ArcEdu</span>
          </div>
          {screen.screen !== "upload" && screen.screen !== "sessions" && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleNewQuiz} className="border border-gray-200 rounded-lg">
                <Plus className="w-4 h-4 mr-1" />
                New Session
              </Button>
            </div>
          )}
        </div>
      </header>

      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
        {screen.screen === "upload" && (
          <Upload
            uploadedDocs={screen.uploadedDocs}
            setUploadedDocsAction={screen.setUploadedDocs}
            error={screen.error}
            setErrorAction={screen.setError}
            isLoading={screen.isLoading}
            setIsLoadingAction={screen.setIsLoading}
            activeSessionId={current?.id || null}
            onCreateAction={async (title) => {
              const session = await create(title);
              setCurrent(session);
              return session;
            }}
            onUpdateSessionAction={update}
            onContinueAction={handleContinue}
            all={all}
            onSessionsClick={() => screen.setScreen("sessions")}
          />
        )}

        {screen.screen === "sessions" && (
          <Sessions
            sessions={all}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
            onBack={() => screen.setScreen("upload")}
          />
        )}

        {screen.screen === "format" && (
          <FormatScreen
            selectedFormat={screen.selectedFormat}
            setSelectedFormatAction={screen.setSelectedFormat}
            numQuestions={screen.numQuestions}
            setNumQuestionsAction={screen.setNumQuestions}
            error={screen.error}
            isLoading={screen.isLoading}
            onSelectAction={handleFormatSelect}
          />
        )}

        {screen.screen === "quiz" && quiz.quizData.length > 0 && (
          <MemoizedQuizScreen
            quizData={quiz.quizData}
            currentQuestion={quiz.currentQuestion}
            selectedAnswer={quiz.selectedAnswer}
            userAnswers={quiz.userAnswers}
            showFeedback={quiz.showFeedback}
            onAnswerSelectAction={quiz.setSelectedAnswer}
            onContinueAction={quiz.submitAnswer}
            onNextAction={() => {
              if (quiz.isQuizComplete) {
                screen.setScreen("results");
              } else {
                quiz.nextQuestion();
              }
            }}
            onPreviousAction={quiz.prevQuestion}
          />
        )}

        {screen.screen === "flashcards" && flash.flashcardData.length > 0 && (
          <MemoizedFlashcards
            flashcardData={flash.flashcardData}
            currentFlashcard={flash.currentFlashcard}
            isFlashcardFlipped={flash.isFlashcardFlipped}
            onFlipAction={() => flash.setIsFlashcardFlipped(prev => !prev)}
            onScoreAction={(gotIt) => {
              const isLastCard = flash.currentFlashcard === flash.flashcardData.length - 1;
              flash.scoreFlashcard(gotIt);
              if (isLastCard) {
                screen.setScreen("results");
              }
            }}
            onNextAction={flash.nextFlashcard}
            onPreviousAction={flash.prevFlashcard}
          />
        )}

        {screen.screen === "results" && (
          <Results
            selectedFormat={screen.selectedFormat}
            quizData={quiz.quizData}
            flashcardData={flash.flashcardData}
            userAnswers={quiz.userAnswers}
            flashcardAnswers={flash.flashcardAnswers}
            totalTime={quiz.startTime > 0 ? Date.now() - quiz.startTime : 0}
            fastestAnswer={quiz.questionTimes.length > 0 ? Math.min(...quiz.questionTimes) : 0}
            maxStreak={quiz.maxStreak}
            onGoBackAction={() => screen.setScreen("format")}
            onNewSessionAction={handleNewQuiz}
            onRetryAction={handleRetry}
            isLoading={screen.isLoading}
          />
        )}
      </Suspense>
    </div>
  );
}
