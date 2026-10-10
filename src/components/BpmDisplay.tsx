import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { clampBpm, tempoMarking } from '../lib/tempo';

interface BpmDisplayProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

/** The big tempo number. It doubles as a text field for typing an exact BPM. */
export function BpmDisplay({ bpm, onChange }: BpmDisplayProps) {
  const [draft, setDraft] = useState<string | null>(null);
  // Set by Escape so the blur that follows discards the draft instead of committing it.
  const cancelledRef = useRef(false);

  const draftValue = (): number | undefined => {
    if (draft === null || draft.trim() === '') return undefined;
    const parsed = Number(draft);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const commit = () => {
    const value = draftValue();
    if (value !== undefined && !cancelledRef.current) onChange(clampBpm(value));
    cancelledRef.current = false;
    setDraft(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value.replace(/[^\d]/g, ''));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        event.currentTarget.blur();
        break;
      case 'Escape':
        cancelledRef.current = true;
        event.currentTarget.blur();
        break;
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        const step = (event.shiftKey ? 10 : 1) * (event.key === 'ArrowUp' ? 1 : -1);
        onChange(clampBpm((draftValue() ?? bpm) + step));
        setDraft(null);
        break;
      }
    }
  };

  return (
    <div className="bpm-display">
      <div className="bpm-readout">
        <input
          className="bpm-value"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Tempo in beats per minute"
          value={draft ?? String(bpm)}
          onChange={handleChange}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        <span className="bpm-unit" aria-hidden="true">
          BPM
        </span>
      </div>
      <p className="tempo-marking" data-testid="tempo-marking">
        {tempoMarking(bpm)}
      </p>
    </div>
  );
}
