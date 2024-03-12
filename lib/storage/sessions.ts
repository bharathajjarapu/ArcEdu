import * as store from "./store";
import * as cache from "../data/cache";
import type {
  Session,
  Document,
  Chunk,
  QuizAttempt,
  FlashcardSession,
} from "@/types";

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

  await cache.clear(id);

  await store.remove("sessions", id);
}

export async function getDocs(sessionId: string): Promise<Document[]> {
  return store.getByIndex<Document>("documents", "sessionId", sessionId);
}

export async function getChunks(sessionId: string): Promise<Chunk[]> {
  return store.getByIndex<Chunk>("chunks", "sessionId", sessionId);
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

export async function saveFlashcards(session: FlashcardSession): Promise<void> {
  await store.put("flashcards", session);
}

export async function getFlashcards(
  sessionId: string,
): Promise<FlashcardSession | null> {
  const sessions = await store.getByIndex<FlashcardSession>(
    "flashcards",
    "sessionId",
    sessionId,
  );
  return sessions.length > 0 ? sessions[0] : null;
}
