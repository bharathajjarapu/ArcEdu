const DB_NAME = "arcedu";
const DB_VERSION = 4;

interface Store {
  sessions: "id";
  documents: "id";
  chunks: "id";
  quizzes: "id";
  flashcards: "id";
  cache: "hash";
}

let db: IDBDatabase | null = null;

export async function init(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      const stores = [
        "sessions",
        "documents",
        "chunks",
        "quizzes",
        "flashcards",
        "cache",
      ];
      for (const store of stores) {
        if (database.objectStoreNames.contains(store)) {
          database.deleteObjectStore(store);
        }
      }

      database.createObjectStore("sessions", { keyPath: "id" });

      const docStore = database.createObjectStore("documents", {
        keyPath: "id",
      });
      docStore.createIndex("sessionId", "sessionId", { unique: false });

      const chunkStore = database.createObjectStore("chunks", {
        keyPath: "id",
      });
      chunkStore.createIndex("sessionId", "sessionId", { unique: false });
      chunkStore.createIndex("documentId", "documentId", { unique: false });

      const quizStore = database.createObjectStore("quizzes", {
        keyPath: "id",
      });
      quizStore.createIndex("sessionId", "sessionId", { unique: false });

      const flashStore = database.createObjectStore("flashcards", {
        keyPath: "id",
      });
      flashStore.createIndex("sessionId", "sessionId", { unique: false });

      const cacheStore = database.createObjectStore("cache", {
        keyPath: "hash",
      });
      cacheStore.createIndex("sessionId", "sessionId", { unique: false });
    };
  });
}

export async function get<T>(
  store: keyof Store,
  id: string,
): Promise<T | null> {
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readonly");
    const request = tx.objectStore(store).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll<T>(store: keyof Store): Promise<T[]> {
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex<T>(
  store: keyof Store,
  index: string,
  value: string,
): Promise<T[]> {
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readonly");
    const objectStore = tx.objectStore(store);
    const request = objectStore.index(index).getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put<T>(store: keyof Store, data: T): Promise<void> {
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    const request = tx.objectStore(store).put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function putMany<T>(store: keyof Store, items: T[]): Promise<void> {
  if (items.length === 0) return;
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    const obj = tx.objectStore(store);
    for (const item of items) obj.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function remove(store: keyof Store, id: string): Promise<void> {
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    const request = tx.objectStore(store).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clear(store: keyof Store): Promise<void> {
  const database = await init();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, "readwrite");
    const request = tx.objectStore(store).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
