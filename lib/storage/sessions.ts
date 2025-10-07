import * as store from "./store";
import * as cache from "../data/cache";
import type {
  Session,
  Document,
  Chunk,
  QuizAttempt,
  SavedNotes,
  SavedSlides,
} from "@/types";

export interface ChunkContext extends Chunk {
  sessionTitle: string;
  documentName: string;
}

export async function create(title: string): Promise<Session> {
  const session: Session = {
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await store.put("sessions", session);
  return session;
}

export async function getAll(): Promise<Session[]> {
  return store.getAll<Session>("sessions");
}

export async function getById(id: string): Promise<Session | null> {
  return store.get<Session>("sessions", id);
}

export async function update(
  id: string,
  data: Partial<Session>,
): Promise<void> {
  const session = await getById(id);
  if (!session) throw new Error("Session not found");

  const updated = { ...session, ...data, updatedAt: Date.now() };
  await store.put("sessions", updated);
}

export async function remove(id: string): Promise<void> {
  const docs = await store.getByIndex<Document>("documents", "sessionId", id);
  for (const doc of docs) {
    await store.remove("documents", doc.id);
  }

  const chunks = await store.getByIndex<Chunk>("chunks", "sessionId", id);
  for (const chunk of chunks) {
    await store.remove("chunks", chunk.id);
  }

  const notesList = await store.getByIndex<SavedNotes>("notes", "sessionId", id);
  for (const note of notesList) {
    await store.remove("notes", note.id);
  }

  const slidesList = await store.getByIndex<SavedSlides>("slides", "sessionId", id);
  for (const slides of slidesList) {
    await store.remove("slides", slides.id);
  }

  const quizzesList = await store.getByIndex<QuizAttempt>("quizzes", "sessionId", id);
  for (const quiz of quizzesList) {
    await store.remove("quizzes", quiz.id);
  }

  await cache.clear(id);

  await store.remove("sessions", id);
}

export async function getDocs(sessionId: string): Promise<Document[]> {
  return store.getByIndex<Document>("documents", "sessionId", sessionId);
}

export async function getChunks(sessionId: string): Promise<Chunk[]> {
  return store.getByIndex<Chunk>("chunks", "sessionId", sessionId);
}

export async function getAllChunks(): Promise<Chunk[]> {
  return store.getAll<Chunk>("chunks");
}

export async function getChunksForSessions(sessionIds: string[]): Promise<Chunk[]> {
  if (sessionIds.length === 0) return getAllChunks();

  const sessionSet = new Set(sessionIds);
  const chunks = await getAllChunks();
  return chunks.filter((chunk) => sessionSet.has(chunk.sessionId));
}

export async function getChunkContexts(sessionIds?: string[]): Promise<ChunkContext[]> {
  const [allSessions, allDocs, chunks] = await Promise.all([
    store.getAll<Session>("sessions"),
    store.getAll<Document>("documents"),
    sessionIds && sessionIds.length > 0
      ? getChunksForSessions(sessionIds)
      : getAllChunks(),
  ]);

  const sessionSet = sessionIds && sessionIds.length > 0
    ? new Set(sessionIds)
    : null;

  const sessionMap = new Map(
    allSessions
      .filter((session) => !sessionSet || sessionSet.has(session.id))
      .map((session) => [session.id, session]),
  );

  const docMap = new Map(
    allDocs
      .filter((doc) => sessionMap.has(doc.sessionId))
      .map((doc) => [doc.id, doc]),
  );

  return chunks
    .filter((chunk) => sessionMap.has(chunk.sessionId) && docMap.has(chunk.documentId))
    .map((chunk) => {
      const session = sessionMap.get(chunk.sessionId)!;
      const document = docMap.get(chunk.documentId)!;

      return {
        ...chunk,
        sessionTitle: session.title,
        documentName: document.name,
      };
    });
}

export async function saveQuiz(attempt: QuizAttempt): Promise<void> {
  await store.put("quizzes", attempt);
}

export async function getQuiz(sessionId: string): Promise<QuizAttempt | null> {
  const attempts = await store.getByIndex<QuizAttempt>(
    "quizzes",
    "sessionId",
    sessionId,
  );
  return attempts.length > 0 ? attempts[0] : null;
}

export async function getQuizzes(sessionId: string): Promise<QuizAttempt[]> {
  return store.getByIndex<QuizAttempt>("quizzes", "sessionId", sessionId);
}

export async function saveNotes(notes: SavedNotes): Promise<void> {
  await store.put("notes", notes);
}

export async function getNotes(sessionId: string): Promise<SavedNotes[]> {
  return store.getByIndex<SavedNotes>("notes", "sessionId", sessionId);
}

export async function removeNotes(id: string): Promise<void> {
  await store.remove("notes", id);
}

export async function saveSlides(slides: SavedSlides): Promise<void> {
  await store.put("slides", slides);
}

export async function getSlides(sessionId: string): Promise<SavedSlides[]> {
  return store.getByIndex<SavedSlides>("slides", "sessionId", sessionId);
}

export async function removeSlides(id: string): Promise<void> {
  await store.remove("slides", id);
}
