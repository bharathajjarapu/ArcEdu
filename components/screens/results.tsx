"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon, Spinner } from "@/components/icons";
import { Button, Card, cn } from "@/components/ui";
import { useApp } from "@/contexts/app";
import * as db from "@/lib/db";

// Formats milliseconds as "1m 5s".
const time = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
};

// Results step: score, stats, and saving the attempt.
export function Results() {
  const router = useRouter();
  const { play, setPlay, current, busy, error, generate } = useApp();
  const { questions, answers } = play;
  const right = questions.filter((question, index) => answers[index] === question.answer).length;
  const accuracy = questions.length ? Math.round((right / questions.length) * 100) : 0;

  // Saves the finished attempt, keyed by start time so repeat runs overwrite.
  useEffect(() => {
    if (play.end || !current || questions.length === 0) return;
    const end = Date.now();
    setPlay((play) => ({ ...play, end }));
    void db.put("quizzes", { ...play, end, id: String(play.start), sessionId: current.id });
  }, [play.end, current, questions.length]);

  // While a regeneration is in flight the old questions are gone, so show progress instead of a blank result.
  if (questions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        {busy ? <Spinner className="size-6 text-muted-foreground" /> : <p className="text-muted-foreground">{error || "No questions yet."}</p>}
      </div>
    );
  }

  const stats = [
    { label: "Time taken", value: time(play.end - play.start) },
    { label: "Fastest answer", value: time(play.times.length ? Math.min(...play.times) : 0) },
    { label: "Hot streak", value: play.best },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col justify-center px-4 pt-2 pb-12 sm:px-6 md:h-full">
      <div className="mb-10 text-center">
        <p className="text-sm text-muted-foreground">You scored</p>
        <div className="font-heading text-6xl font-bold tracking-tight md:text-8xl">
          {right}
          <span className="text-4xl text-muted-foreground md:text-6xl">/{questions.length}</span>
        </div>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          {right} of {questions.length} correct, that&apos;s {accuracy}% accuracy.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="font-heading text-3xl font-bold">{play.end ? stat.value : "–"}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-10 flex flex-wrap justify-center gap-2 p-4">
        {questions.map((question, index) => {
          const correct = answers[index] === question.answer;
          return (
            <span
              key={index}
              aria-label={`Question ${index + 1}: ${correct ? "correct" : "incorrect"}`}
              className={cn(
                "flex size-10 items-center justify-center rounded-md border",
                correct ? "border-success bg-success text-white" : "border-danger bg-danger/10 text-danger",
              )}
            >
              <Icon name={correct ? "check" : "x"} className="size-5" />
            </span>
          );
        })}
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={() => {
            setPlay((play) => ({ ...play, index: 0 }));
            router.push("/quiz");
          }}
        >
          <Icon name="list-checks" /> Review answers
        </Button>
        <Button size="lg" disabled={busy} onClick={() => void generate()}>
          {busy ? <><Spinner /> Generating…</> : <><Icon name="rotate-ccw" /> Generate new</>}
        </Button>
      </div>
    </div>
  );
}
