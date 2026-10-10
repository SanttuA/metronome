import type { CSSProperties } from 'react';

import { MAX_BPM, MIN_BPM } from '../lib/tempo';
import { MinusIcon, PlusIcon } from './icons';

interface TempoControlsProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

export function TempoControls({ bpm, onChange }: TempoControlsProps) {
  const fill = ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100;

  return (
    <div className="tempo-controls">
      <button
        type="button"
        className="round-button"
        aria-label="Decrease tempo"
        disabled={bpm <= MIN_BPM}
        onClick={() => onChange(bpm - 1)}
      >
        <MinusIcon />
      </button>
      <input
        className="slider"
        type="range"
        aria-label="Tempo"
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        value={bpm}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <button
        type="button"
        className="round-button"
        aria-label="Increase tempo"
        disabled={bpm >= MAX_BPM}
        onClick={() => onChange(bpm + 1)}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
