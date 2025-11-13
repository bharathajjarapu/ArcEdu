"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

function resolveInitial<T>(initialValue: T | (() => T)): T {
    return typeof initialValue === "function"
        ? (initialValue as () => T)()
        : initialValue;
}

export function readSessionStorage<T>(
    key: string,
    initialValue: T | (() => T),
): T {
    const fallback = resolveInitial(initialValue);
    if (typeof window === "undefined") return fallback;

    try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function clearSessionStorageKey(key: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
}

export function useSessionStorageState<T>(
    key: string,
    initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() =>
        readSessionStorage(key, initialValue),
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Ignore storage errors and keep runtime state usable.
        }
    }, [key, value]);

    return [value, setValue];
}
