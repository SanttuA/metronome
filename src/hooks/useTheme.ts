import { useCallback, useEffect } from 'react';

import { DEFAULT_THEME, parseTheme, type Theme } from '../lib/settings';
import { usePersistentState } from './usePersistentState';

/** Must match the inline script in index.html that applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'metronome.theme';

/** Browser UI colour (address bar, installed app title bar); matches --bg in styles.css. */
export const THEME_COLORS: Record<Theme, string> = { dark: '#0e0d14', light: '#f3f2f8' };

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = usePersistentState(THEME_STORAGE_KEY, DEFAULT_THEME, parseTheme);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return [theme, toggleTheme];
}
