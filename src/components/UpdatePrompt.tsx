import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const OFFLINE_READY_TIMEOUT = 5000;

/**
 * Tells the user when the app has been cached for offline use, and when a new
 * version is ready. Updates wait for a click so playback is never interrupted.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  // "Ready to work offline" is just informational, so it hides itself.
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), OFFLINE_READY_TIMEOUT);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  const close = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  // The live region is always rendered so screen readers announce new messages.
  return (
    <output className="toast-region">
      {(needRefresh || offlineReady) && (
        <span className="toast">
          <span>{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
          <span className="toast-actions">
            {needRefresh && (
              <button
                type="button"
                className="toast-button toast-button-primary"
                onClick={() => void updateServiceWorker()}
              >
                Reload
              </button>
            )}
            <button type="button" className="toast-button" onClick={close}>
              {needRefresh ? 'Later' : 'OK'}
            </button>
          </span>
        </span>
      )}
    </output>
  );
}
