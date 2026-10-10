import { useCallback, useEffect, useRef, useState } from 'react';

import { MetronomeEngine, type EngineSettings } from '../audio/engine';

export interface Metronome {
  isPlaying: boolean;
  /** Index of the beat currently sounding, or `null` when stopped. */
  currentBeat: number | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useMetronome({
  bpm,
  beatsPerBar,
  accentFirstBeat,
  volume,
}: EngineSettings): Metronome {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const engineRef = useRef<MetronomeEngine | null>(null);
  const settingsRef = useRef<EngineSettings>({ bpm, beatsPerBar, accentFirstBeat, volume });

  useEffect(() => {
    settingsRef.current = { bpm, beatsPerBar, accentFirstBeat, volume };
    engineRef.current?.update(settingsRef.current);
  }, [bpm, beatsPerBar, accentFirstBeat, volume]);

  useEffect(
    () => () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  const start = useCallback(() => {
    // Created lazily: browsers only allow audio after a user gesture.
    engineRef.current ??= new MetronomeEngine(settingsRef.current, setCurrentBeat);
    engineRef.current.start();
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (engineRef.current?.isRunning) stop();
    else start();
  }, [start, stop]);

  return { isPlaying, currentBeat, start, stop, toggle };
}
