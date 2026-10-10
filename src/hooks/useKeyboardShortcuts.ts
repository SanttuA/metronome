import { useEffect, useLayoutEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onToggle: () => void;
  onNudgeBpm: (delta: number) => void;
}

/** Form fields handle these keys themselves (typing, sliders, toggles, …). */
function isFormField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/**
 * Space starts/stops, ↑/↓ change the tempo by 1 BPM and Shift+↑/↓ by 10.
 * Keys aimed at form fields are left alone so they keep working normally.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // A layout effect attaches the listener in the same commit that first shows
  // the UI, so shortcuts never appear unresponsive right after load.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      if (isFormField(event.target)) return;

      switch (event.key) {
        case ' ':
          // Prevents scrolling and stops a focused button from also being clicked.
          event.preventDefault();
          if (!event.repeat) handlersRef.current.onToggle();
          break;
        case 'ArrowUp':
        case 'ArrowDown': {
          event.preventDefault();
          const step = event.shiftKey ? 10 : 1;
          handlersRef.current.onNudgeBpm(event.key === 'ArrowUp' ? step : -step);
          break;
        }
      }
    };

    // Some browsers activate a focused button on keyup, so swallow that too.
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
}
