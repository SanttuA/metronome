import { useCallback } from 'react';

import { BeatIndicator } from './components/BeatIndicator';
import { BpmDisplay } from './components/BpmDisplay';
import { PlayButton } from './components/PlayButton';
import { SettingsPanel } from './components/SettingsPanel';
import { TempoControls } from './components/TempoControls';
import { ThemeToggle } from './components/ThemeToggle';
import { UpdatePrompt } from './components/UpdatePrompt';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMetronome } from './hooks/useMetronome';
import { usePersistentState } from './hooks/usePersistentState';
import { useTheme } from './hooks/useTheme';
import { parseBoolean, parseBpm, parseTimeSignature, parseVolume } from './lib/settings';
import { DEFAULT_BPM, DEFAULT_TIME_SIGNATURE, beatsPerBar, clampBpm } from './lib/tempo';

export function App() {
  const [bpm, setBpm] = usePersistentState('metronome.bpm', DEFAULT_BPM, parseBpm);
  const [timeSignature, setTimeSignature] = usePersistentState(
    'metronome.timeSignature',
    DEFAULT_TIME_SIGNATURE,
    parseTimeSignature,
  );
  const [accentFirstBeat, setAccentFirstBeat] = usePersistentState(
    'metronome.accentFirstBeat',
    true,
    parseBoolean,
  );
  const [volume, setVolume] = usePersistentState('metronome.volume', 0.8, parseVolume);
  const [theme, toggleTheme] = useTheme();

  const beats = beatsPerBar(timeSignature);
  const { isPlaying, currentBeat, toggle } = useMetronome({
    bpm,
    beatsPerBar: beats,
    accentFirstBeat,
    volume,
  });

  const changeBpm = useCallback((next: number) => setBpm(clampBpm(next)), [setBpm]);
  const nudgeBpm = useCallback(
    (delta: number) => setBpm((current) => clampBpm(current + delta)),
    [setBpm],
  );
  useKeyboardShortcuts({ onToggle: toggle, onNudgeBpm: nudgeBpm });

  return (
    <main className="app">
      <section className="card" aria-labelledby="app-title">
        <header className="card-header">
          <h1 id="app-title" className="title">
            Metronome
          </h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <BpmDisplay bpm={bpm} onChange={changeBpm} />
        <BeatIndicator beats={beats} currentBeat={currentBeat} accentFirstBeat={accentFirstBeat} />
        <TempoControls bpm={bpm} onChange={changeBpm} />
        <PlayButton isPlaying={isPlaying} onToggle={toggle} />
        <SettingsPanel
          timeSignature={timeSignature}
          onTimeSignatureChange={setTimeSignature}
          accentFirstBeat={accentFirstBeat}
          onAccentFirstBeatChange={setAccentFirstBeat}
          volume={volume}
          onVolumeChange={setVolume}
        />
      </section>

      <footer className="shortcuts" aria-label="Keyboard shortcuts">
        <span>
          <kbd>Space</kbd> start / stop
        </span>
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> ±1 BPM
        </span>
        <span>
          <kbd>Shift</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> ±10 BPM
        </span>
      </footer>
      <UpdatePrompt />
    </main>
  );
}
