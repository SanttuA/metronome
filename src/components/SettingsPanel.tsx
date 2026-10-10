import type { CSSProperties } from 'react';

import { TIME_SIGNATURES, isTimeSignatureId, type TimeSignatureId } from '../lib/tempo';

interface SettingsPanelProps {
  timeSignature: TimeSignatureId;
  onTimeSignatureChange: (timeSignature: TimeSignatureId) => void;
  accentFirstBeat: boolean;
  onAccentFirstBeatChange: (accent: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function SettingsPanel({
  timeSignature,
  onTimeSignatureChange,
  accentFirstBeat,
  onAccentFirstBeatChange,
  volume,
  onVolumeChange,
}: SettingsPanelProps) {
  return (
    <div className="settings">
      <label className="setting">
        <span className="setting-label">Time signature</span>
        <select
          className="select"
          value={timeSignature}
          onChange={(event) => {
            if (isTimeSignatureId(event.target.value)) onTimeSignatureChange(event.target.value);
          }}
        >
          {TIME_SIGNATURES.map(({ id }) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>

      <label className="setting">
        <span className="setting-label">Accent first beat</span>
        <input
          className="switch"
          type="checkbox"
          role="switch"
          aria-checked={accentFirstBeat}
          checked={accentFirstBeat}
          onChange={(event) => onAccentFirstBeatChange(event.target.checked)}
        />
      </label>

      <label className="setting">
        <span className="setting-label">
          Volume <span className="setting-value">{Math.round(volume * 100)}%</span>
        </span>
        <input
          className="slider slider-small"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          style={{ '--fill': `${volume * 100}%` } as CSSProperties}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
