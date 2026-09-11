"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { Icon, Spinner } from "@/components/icons";
import { Badge, Button, Card, Empty, Tip, buttonVariants, cn } from "@/components/ui";
import { Docs, accept } from "@/components/docs";
import { ago } from "@/components/sidebar";
import { fresh, useApp } from "@/contexts/app";
import * as db from "@/lib/db";
import type { Attempt, Saved } from "@/types";

interface Item {
  id: string;
  title: string;
  time: number;
  badge?: string;
  open: () => void;
  remove?: () => void;
}

// Compact list of saved notes, slides or quizzes.
function List({ items, empty }: { items: Item[]; empty: string }) {
  if (items.length === 0) return <Empty title={empty} />;
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3">
          <button onClick={item.open} className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="block truncate font-medium hover:underline">{item.title}</span>
            <span className="text-xs text-muted-foreground">{ago(item.time)}</span>
          </button>
          {item.badge && <Badge variant="default" className="h-6 px-2 text-xs">{item.badge}</Badge>}
          {item.remove && (
            <Tip label="Delete">
              <Button variant="ghost" size="icon-sm" onClick={item.remove} aria-label={`Delete ${item.title}`} className="text-muted-foreground hover:text-foreground">
                <Icon name="trash-2" />
              </Button>
            </Tip>
          )}
        </li>
      ))}
    </ul>
  );
}

// Session page: documents plus everything generated from them.
export function Session() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessions, loading, current, docs, setSessionId, upload, busy, error, setNotes, setSlides, setPlay } = useApp();
  const [notes, setNotesList] = useState<Saved[]>([]);
  const [decks, setDecks] = useState<Saved[]>([]);
  const [quizzes, setQuizzes] = useState<Attempt[]>([]);

  useEffect(() => {
    setSessionId(id);
    // Newest first.
    const sort = <T extends { createdAt?: number; end?: number }>(list: T[]) =>
      list.toSorted((a, b) => (b.createdAt ?? b.end ?? 0) - (a.createdAt ?? a.end ?? 0));
    void Promise.all([db.list<Saved>("notes", id), db.list<Saved>("slides", id), db.list<Attempt>("quizzes", id)])
      .then(([notes, decks, quizzes]) => {
        setNotesList(sort(notes));
        setDecks(sort(decks));
        setQuizzes(sort(quizzes));
      });
  }, [id]);

  useEffect(() => {
    if (!loading && !sessions.some((session) => session.id === id)) router.push("/upload");
  }, [loading, sessions, id, router]);

  if (current?.id !== id) {
    return <div className="flex justify-center py-20"><Spinner className="size-6 text-muted-foreground" /></div>;
  }

  const tabs = [
    {
      value: "notes",
      label: "Notes",
      empty: "No notes yet",
      items: notes.map((note) => ({
        id: note.id,
        title: note.title,
        time: note.createdAt,
        open: () => {
          setNotes(note.content);
          router.push("/notes");
        },
        remove: () => void db.remove("notes", note.id).then(() => setNotesList((list) => list.filter((item) => item.id !== note.id))),
      })),
    },
    {
      value: "slides",
      label: "Slides",
      empty: "No slide decks yet",
      items: decks.map((deck) => ({
        id: deck.id,
        title: deck.title,
        time: deck.createdAt,
        open: () => {
          setSlides(deck.content);
          router.push("/slides");
        },
        remove: () => void db.remove("slides", deck.id).then(() => setDecks((list) => list.filter((item) => item.id !== deck.id))),
      })),
    },
    {
      value: "quizzes",
      label: "Quizzes",
      empty: "No quiz attempts yet",
      items: quizzes.map((quiz) => {
        const score = quiz.questions.filter((question, index) => quiz.answers[index] === question.answer).length;
        return {
          id: quiz.id,
          title: `Score: ${score}/${quiz.questions.length}`,
          time: quiz.end,
          badge: `${Math.round((score / quiz.questions.length) * 100)}%`,
          open: () => {
            setPlay({ ...fresh, ...quiz });
            router.push("/results");
          },
        };
      }),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-2 pb-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-bold tracking-tight sm:text-3xl">{current.title}</h1>
          <p className="text-sm text-muted-foreground">
            {docs.length} {docs.length === 1 ? "document" : "documents"} · updated {ago(current.updatedAt)}
          </p>
        </div>
        <Link href="/format" className={buttonVariants({ size: "lg" })}>
          <Icon name="sparkles" /> Generate
        </Link>
      </div>

      <Card className="mb-8 flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading font-semibold">Documents</h2>
          <label className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-ring/50", busy && "pointer-events-none opacity-50")}>
            {busy ? <Spinner /> : <Icon name="plus" />}
            Add
            <input
              type="file"
              multiple
              accept={accept}
              className="sr-only"
              aria-label={`Add documents to ${current.title}`}
              onChange={(event) => {
                void upload(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <Docs />
        {error && <p role="alert" className="text-sm">{error}</p>}
      </Card>

      <Tabs.Root defaultValue="notes">
        <Tabs.List aria-label="Saved work" className="relative mb-4 flex gap-1 border-b">
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 rounded-t-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-active:text-foreground"
            >
              {tab.label}
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{tab.items.length}</span>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute bottom-[-1px] left-(--active-tab-left) h-0.5 w-(--active-tab-width) bg-primary transition-all duration-200" />
        </Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value} className="outline-none">
            <List items={tab.items} empty={tab.empty} />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}
