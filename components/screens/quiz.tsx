"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Button, Card, cn } from "@/components/ui";
import { useApp } from "@/contexts/app";

// Formats seconds as mm:ss.
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

// Quiz step: answer one question at a time against the clock.
export function Quiz() {
  const router = useRouter();
  const { play, setPlay, options } = useApp();
  const [picked, setPicked] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const { questions, index, answers } = play;
  const limit = play.end ? 0 : options.minutes * 60;
  const left = limit && now ? Math.max(0, limit - Math.floor((now - play.start) / 1000)) : Infinity;

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time is up: go to results.
  useEffect(() => {
    if (left === 0 && play.start) router.push("/results");
  }, [left, play.start, router]);

  if (questions.length === 0) return null;

  const question = questions[index];
  const answer = answers[index];
  const answered = answer !== undefined;
  const selected = answered ? answer : picked;
  const last = index === questions.length - 1;

  // Moves to another question.
  const go = (step: number) => {
    setPicked(null);
    setPlay((play) => ({ ...play, index: play.index + step, shown: Date.now() }));
  };

  // Locks in the picked answer and updates the streak.
  const submit = () => {
    if (picked === null) return;
    setPlay((play) => {
      const streak = picked === question.answer ? play.streak + 1 : 0;
      return {
        ...play,
        answers: { ...play.answers, [play.index]: picked },
        times: [...play.times, Date.now() - play.shown],
        streak,
        best: Math.max(play.best, streak),
      };
    });
  };

  const correct = answered && answer === question.answer;
  const low = left < limit * 0.2;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-2 pb-6 sm:px-6 md:h-full">
      <div className="flex items-center gap-3 pb-5">
        <Button variant="outline" size="icon-lg" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous question">
          <Icon name="chevron-left" />
        </Button>
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm text-muted-foreground tabular-nums">
            <span>Question {index + 1} of {questions.length}</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1" aria-label="Time on this question">
                <Icon name="timer" className="size-4" /> {clock(Math.max(0, Math.floor((now - play.shown) / 1000)))}
              </span>
              <span className={cn("flex items-center gap-1", low && "font-medium text-danger")} aria-label="Time left">
                <Icon name="hourglass" className="size-4" /> {left === Infinity ? "∞" : clock(left)}
              </span>
            </span>
          </div>
          <div role="progressbar" aria-label="Quiz progress" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1} className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
        <Button variant="outline" size="icon-lg" onClick={() => go(1)} disabled={last} aria-label="Next question">
          <Icon name="chevron-right" />
        </Button>
      </div>

      <div className="min-h-0 overflow-y-auto">
        <h2 className="mb-5 font-heading text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl">
          {question.question}
        </h2>

        <div className="space-y-2.5">
          {question.options.map((option, choice) => {
            const right = answered && choice === question.answer;
            const wrong = answered && choice === selected && !right;
            const chosen = !answered && choice === selected;
            return (
              <button
                key={choice}
                onClick={() => setPicked(choice)}
                disabled={answered}
                aria-pressed={choice === selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  !answered && !chosen && "hover:bg-muted/50",
                  chosen && "border-primary",
                  right && "border-success bg-success/10",
                  wrong && "border-danger bg-danger/10",
                  answered && !right && !wrong && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md border text-sm font-medium",
                    chosen && "border-primary bg-primary text-primary-foreground",
                    right && "border-success bg-success text-white",
                    wrong && "border-danger bg-danger text-white",
                  )}
                >
                  {wrong ? <Icon name="x" className="size-4" /> : right ? <Icon name="check" className="size-4" /> : String.fromCharCode(65 + choice)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <Card role="status" className={cn("mt-4 p-4", correct ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10")}>
            <h3 className={cn("font-heading font-semibold", correct ? "text-success" : "text-danger")}>
              {correct ? "Correct" : "Not quite"}
            </h3>
            {options.reveal && (
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {question.explanation || `The correct answer is ${String.fromCharCode(65 + question.answer)}: ${question.options[question.answer]}`}
              </p>
            )}
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-5">
        <Button variant="outline" size="xl" onClick={() => go(-1)} disabled={index === 0}>
          <Icon name="chevron-left" /> Previous
        </Button>
        {answered ? (
          <Button size="xl" onClick={() => (last ? router.push("/results") : go(1))}>
            {last ? "Finish" : "Continue"} <Icon name="chevron-right" />
          </Button>
        ) : (
          <Button size="xl" onClick={submit} disabled={picked === null}>
            Check <Icon name="chevron-right" />
          </Button>
        )}
      </div>
    </div>
  );
}
