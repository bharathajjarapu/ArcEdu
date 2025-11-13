const DB_NAME = "arcedu";
const DB_VERSION = 6;

interface Store {
  sessions: "id";
  documents: "id";
  chunks: "id";
  quizzes: "id";
  notes: "id";
  slides: "id";
  cache: "hash";
}

let db: IDBDatabase | null = null;

function ensureIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string,
  options: IDBIndexParameters = { unique: false },
) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options);
  }
}

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

      if (!database.objectStoreNames.contains("sessions")) {
        database.createObjectStore("sessions", { keyPath: "id" });
      }

      const docStore = database.objectStoreNames.contains("documents")
        ? request.transaction!.objectStore("documents")
        : database.createObjectStore("documents", { keyPath: "id" });
      ensureIndex(docStore, "sessionId", "sessionId");

      const chunkStore = database.objectStoreNames.contains("chunks")
        ? request.transaction!.objectStore("chunks")
        : database.createObjectStore("chunks", { keyPath: "id" });
      ensureIndex(chunkStore, "sessionId", "sessionId");
      ensureIndex(chunkStore, "documentId", "documentId");

      const quizStore = database.objectStoreNames.contains("quizzes")
        ? request.transaction!.objectStore("quizzes")
        : database.createObjectStore("quizzes", { keyPath: "id" });
      ensureIndex(quizStore, "sessionId", "sessionId");

      const notesStore = database.objectStoreNames.contains("notes")
        ? request.transaction!.objectStore("notes")
        : database.createObjectStore("notes", { keyPath: "id" });
      ensureIndex(notesStore, "sessionId", "sessionId");

      const slidesStore = database.objectStoreNames.contains("slides")
        ? request.transaction!.objectStore("slides")
        : database.createObjectStore("slides", { keyPath: "id" });
      ensureIndex(slidesStore, "sessionId", "sessionId");

      const cacheStore = database.objectStoreNames.contains("cache")
        ? request.transaction!.objectStore("cache")
        : database.createObjectStore("cache", { keyPath: "hash" });
      ensureIndex(cacheStore, "sessionId", "sessionId");
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
