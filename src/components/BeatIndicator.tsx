interface BeatIndicatorProps {
  beats: number;
  currentBeat: number | null;
  accentFirstBeat: boolean;
}

/** One dot per beat in the bar; the sounding beat lights up. Purely visual. */
export function BeatIndicator({ beats, currentBeat, accentFirstBeat }: BeatIndicatorProps) {
  return (
    <ol className="beats" data-testid="beat-indicator" aria-hidden="true">
      {Array.from({ length: beats }, (_, index) => (
        <li
          key={index}
          className="beat"
          data-active={currentBeat === index}
          data-accent={accentFirstBeat && index === 0}
        />
      ))}
    </ol>
  );
}
