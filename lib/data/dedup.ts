const pending = new Map<string, Promise<any>>();

export async function call<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pending.has(key)) {
    return pending.get(key) as Promise<T>;
  }

  const promise = fn().finally(() => {
    pending.delete(key);
  });

  pending.set(key, promise);
  return promise;
}

export function clear(key?: string) {
  if (key) {
    pending.delete(key);
  } else {
    pending.clear();
  }
}

export function has(key: string): boolean {
  return pending.has(key);
}
