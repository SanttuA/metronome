import { useCallback, useEffect } from 'react';

import { DEFAULT_THEME, parseTheme, type Theme } from '../lib/settings';
import { usePersistentState } from './usePersistentState';

/** Must match the inline script in index.html that applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'metronome.theme';

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = usePersistentState(THEME_STORAGE_KEY, DEFAULT_THEME, parseTheme);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return [theme, toggleTheme];
}
