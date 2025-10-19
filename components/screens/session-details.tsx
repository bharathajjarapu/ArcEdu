"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/contexts/session";
import { useAppState } from "@/contexts/state";
import { useRouter } from "next/navigation";
import * as sessions from "@/lib/storage/sessions";
import * as docsStore from "@/lib/storage/docs";
import * as queue from "@/lib/process/queue";
import * as worker from "@/lib/process/worker";
import { getRelativeTime } from "@/lib/format";
import { parse } from "@/lib/parse";
import { simple as simpleHash } from "@/lib/data/hash";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Presentation, Target, Trash2 } from "lucide-react";
import { PageBackButton } from "@/components/page-back-button";
import { SessionDocuments } from "@/components/session-documents";
import type { Chunk, SavedNotes, SavedSlides, QuizAttempt } from "@/types";

interface SessionDetailsProps {
    sessionId: string;
}

export function SessionDetails({ sessionId }: SessionDetailsProps) {
    const router = useRouter();
    const state = useAppState();
    const { setCurrent, refresh, update } = useSession();

    const [session, setSession] = useState<any>(null);
    const [docs, setDocs] = useState<any[]>([]);
    const [notes, setNotesList] = useState<SavedNotes[]>([]);
    const [slides, setSlidesList] = useState<SavedSlides[]>([]);
    const [quizzes, setQuizzesList] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDocs = async () => {
        const sessionDocs = await sessions.getDocs(sessionId);
        setDocs(sessionDocs);
        state.setUploadedDocs(sessionDocs.map((doc) => ({ id: doc.id, name: doc.name, size: doc.size })));
        if (sessionDocs.length > 0) {
            state.setTopic(sessionDocs.map((doc) => doc.name).join(", "));
        }
    };

    useEffect(() => {
        async function loadData() {
            try {
                const s = await sessions.getById(sessionId);
                if (!s) {
                    router.push("/sessions");
                    return;
                }
                setSession(s);
                setCurrent(s); // Set as active session

                const d = await sessions.getDocs(sessionId);
                setDocs(d);
                state.setUploadedDocs(d.map((doc) => ({ id: doc.id, name: doc.name, size: doc.size })));
                if (d.length > 0) {
                    state.setTopic(d.map((doc) => doc.name).join(", "));
                }

                const [n, sl, q] = await Promise.all([
                    sessions.getNotes(sessionId),
                    sessions.getSlides(sessionId),
                    sessions.getQuizzes(sessionId)
                ]);

                // Backwards compatibility for older sessions
                if (s.notesContent && n.length === 0) {
                    n.push({
                        id: s.id + '-legacy-notes',
                        sessionId: s.id,
                        title: 'Initial Notes',
                        content: s.notesContent,
                        createdAt: s.updatedAt || Date.now() - 1000,
                    });
                }

                if (s.slidesContent && sl.length === 0) {
                    sl.push({
                        id: s.id + '-legacy-slides',
                        sessionId: s.id,
                        title: 'Initial Slides',
                        content: s.slidesContent,
                        createdAt: s.updatedAt || Date.now() - 1000,
                    });
                }

                setNotesList(n.sort((a, b) => b.createdAt - a.createdAt));
                setSlidesList(sl.sort((a, b) => b.createdAt - a.createdAt));
                setQuizzesList(q.sort((a, b) => b.completedAt - a.completedAt));
            } catch (err) {
                console.error("Failed to load session details", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [sessionId, router, setCurrent, state]);

    const handleCreateNew = () => {
        router.push("/format");
    };

    const handleOpenNotes = (note: SavedNotes) => {
        state.notes.hydrateNotes(note.content);
        router.push(`/notes?sessionId=${sessionId}`);
    };

    const handleOpenSlides = (slideDesc: SavedSlides) => {
        state.slides.hydrateSlides(slideDesc.content, 0);
        router.push(`/slides?sessionId=${sessionId}`);
    };

    const handleOpenQuiz = (quiz: QuizAttempt) => {
        state.quiz.hydrateQuiz({
            quizData: quiz.quizData,
            userAnswers: quiz.answers,
            currentQuestion: Math.max(0, quiz.quizData.length - 1),
            showFeedback: true,
            startTime: quiz.totalTime ? quiz.completedAt - quiz.totalTime : 0,
            questionTimes: quiz.questionTimes,
            maxStreak: quiz.maxStreak,
            isSaved: true,
        });
        router.push(`/results?sessionId=${sessionId}`);
    };

    const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await sessions.removeNotes(id);
        setNotesList(prev => prev.filter(n => n.id !== id));
    };

    const handleDeleteSlides = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await sessions.removeSlides(id);
        setSlidesList(prev => prev.filter(s => s.id !== id));
    };

    const handleAddDocs = async (files: File[]) => {
        state.setIsLoading(true);
        state.setError(null);

        try {
            const pdfQueue = queue.create(2);

            await pdfQueue.all(
                files.map((file) => async () => {
                    const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
                    const content = await parse(file);
                    if (!content) return;

                    const doc = await docsStore.create(sessionId, file.name, size, content);
                    const textChunks = await worker.chunkText(content);
                    const chunks: Chunk[] = textChunks.map((text, index) => ({
                        id: crypto.randomUUID(),
                        sessionId,
                        documentId: doc.id,
                        text,
                        embedding: [],
                        index,
                        hash: simpleHash(text),
                    }));

                    await docsStore.saveChunks(chunks);
                }),
            );

            await update(sessionId, {});
            const updatedSession = await sessions.getById(sessionId);
            if (updatedSession) {
                setSession(updatedSession);
                setCurrent(updatedSession);
            }
            await loadDocs();
            await refresh();
        } catch (error) {
            console.error("Failed to add session documents", error);
            state.setError("Failed to upload files");
        } finally {
            state.setIsLoading(false);
        }
    };

    const handleRemoveDoc = async (docId: string) => {
        try {
            await docsStore.remove(docId);
            await update(sessionId, {});
            const updatedSession = await sessions.getById(sessionId);
            if (updatedSession) {
                setSession(updatedSession);
                setCurrent(updatedSession);
            }
            await loadDocs();
            await refresh();
        } catch (error) {
            console.error("Failed to remove session document", error);
            state.setError("Failed to remove file");
        }
    };

    // Need a function for removing quiz attempts from store too, but for simplicity let's stick to notes/slides for now or just avoid deletion.

    if (loading || !session) {
        return <div className="max-w-7xl mx-auto py-10 px-5 text-gray-400">Loading session...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-5">
            <PageBackButton label="Back to Sessions" onClick={() => router.push("/sessions")} className="mb-6 -ml-3" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
                </div>
                <Button onClick={handleCreateNew} className="px-5 h-11 bg-gray-900 hover:bg-gray-800 shadow-sm border border-transparent hover:border-gray-700 transition">
                    <Plus className="w-4 h-4 mr-2" /> Generate New
                </Button>
            </div>

            <div className="space-y-10">
                <section className="bg-white border border-gray-200 rounded-[calc(var(--radius)+2px)] p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage the files for this session here.</p>
                        </div>
                    </div>
                    <SessionDocuments
                        documents={docs.map((doc) => ({ id: doc.id, name: doc.name, size: doc.size }))}
                        sessionTitle={session.title}
                        onAddDocs={handleAddDocs}
                        onRemoveDoc={handleRemoveDoc}
                    />
                </section>

                {/* Notes Section */}
                {notes.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="p-1.5 bg-gray-100 rounded-[calc(var(--radius)+2px)]"><FileText className="w-5 h-5 text-gray-700" /></span>
                            Saved Notes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map(note => (
                                <div key={note.id} onClick={() => handleOpenNotes(note)} className="group cursor-pointer bg-white border border-gray-200 rounded-[calc(var(--radius)+2px)] p-5 hover:border-gray-300 hover:shadow-sm transition-all relative">
                                    <h3 className="font-medium text-gray-900 mb-1">{note.title}</h3>
                                    <p className="text-sm text-gray-500">{getRelativeTime(new Date(note.createdAt))}</p>
                                    <button onClick={(e) => handleDeleteNote(e, note.id)} className="absolute top-4 right-4 p-1.5 rounded-[calc(var(--radius)+2px)] text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Slides Section */}
                {slides.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="p-1.5 bg-gray-100 rounded-[calc(var(--radius)+2px)]"><Presentation className="w-5 h-5 text-gray-700" /></span>
                            Slide Decks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {slides.map(slide => (
                                <div key={slide.id} onClick={() => handleOpenSlides(slide)} className="group cursor-pointer bg-white border border-gray-200 rounded-[calc(var(--radius)+2px)] p-5 hover:border-gray-300 hover:shadow-sm transition-all relative">
                                    <h3 className="font-medium text-gray-900 mb-1">{slide.title}</h3>
                                    <p className="text-sm text-gray-500">{getRelativeTime(new Date(slide.createdAt))}</p>
                                    <button onClick={(e) => handleDeleteSlides(e, slide.id)} className="absolute top-4 right-4 p-1.5 rounded-[calc(var(--radius)+2px)] text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Quizzes Section */}
                {quizzes.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="p-1.5 bg-gray-100 rounded-[calc(var(--radius)+2px)]"><Target className="w-5 h-5 text-gray-700" /></span>
                            Quiz Attempts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quizzes.map(quiz => (
                                <div key={quiz.id} onClick={() => handleOpenQuiz(quiz)} className="cursor-pointer bg-white border border-gray-200 rounded-[calc(var(--radius)+2px)] p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-medium text-gray-900">Score: {quiz.score}/{quiz.quizData.length}</h3>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{Math.round((quiz.score / quiz.quizData.length) * 100)}%</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{getRelativeTime(new Date(quiz.completedAt))}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {notes.length === 0 && slides.length === 0 && quizzes.length === 0 && (
                    <div className="text-center py-20 bg-white border border-gray-200 border-dashed rounded-[calc(var(--radius)+2px)]">
                        <p className="text-gray-500 mb-4">Nothing has been generated in this session yet.</p>
                        <Button onClick={handleCreateNew} variant="outline" className="rounded-[calc(var(--radius)+2px)]">
                            Get Started
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
