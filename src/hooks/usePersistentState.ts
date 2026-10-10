import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function readStoredValue<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | undefined,
): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return parse(JSON.parse(stored)) ?? fallback;
  } catch {
    // Corrupt JSON or storage blocked (e.g. privacy mode): use the default.
    return fallback;
  }
}

/** `useState` that is loaded from and saved to localStorage under `key`. */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | undefined,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(() => readStoredValue(key, fallback, parse));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: settings just won't survive a reload.
    }
  }, [key, value]);

  return [value, setValue];
}
