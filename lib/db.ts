type Store = "sessions" | "documents" | "notes" | "slides" | "quizzes";

const stores: Store[] = ["sessions", "documents", "notes", "slides", "quizzes"];
let database: Promise<IDBDatabase> | undefined;

// Opens IndexedDB; a version bump rebuilds every store.
function open() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("arcedu", 7);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of Array.from(db.objectStoreNames)) db.deleteObjectStore(name);
      for (const name of stores) {
        const store = db.createObjectStore(name, { keyPath: "id" });
        if (name !== "sessions") store.createIndex("sessionId", "sessionId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

// Runs one request on a store and resolves its result.
async function run<T>(name: Store, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest) {
  const store = (await open()).transaction(name, mode).objectStore(name);
  return new Promise<T>((resolve, reject) => {
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// One record by id.
export const get = <T>(name: Store, id: string) => run<T | undefined>(name, "readonly", (store) => store.get(id));

// Every record in a store.
export const all = <T>(name: Store) => run<T[]>(name, "readonly", (store) => store.getAll());

// Records saved under one session.
export const list = <T>(name: Store, sessionId: string) =>
  run<T[]>(name, "readonly", (store) => store.index("sessionId").getAll(sessionId));

// Inserts or replaces a record.
export const put = <T extends { id: string }>(name: Store, value: T) => run(name, "readwrite", (store) => store.put(value));

// Deletes a record by id.
export const remove = (name: Store, id: string) => run(name, "readwrite", (store) => store.delete(id));

// Deletes a session and everything saved under it.
export async function drop(sessionId: string) {
  const transaction = (await open()).transaction(stores, "readwrite");
  transaction.objectStore("sessions").delete(sessionId);
  for (const name of stores.slice(1)) {
    const store = transaction.objectStore(name);
    const request = store.index("sessionId").getAllKeys(sessionId);
    request.onsuccess = () => request.result.forEach((key) => store.delete(key));
  }
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
