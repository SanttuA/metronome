import { PlayIcon, StopIcon } from './icons';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function PlayButton({ isPlaying, onToggle }: PlayButtonProps) {
  return (
    <button
      type="button"
      className="play-button"
      data-playing={isPlaying}
      aria-label={isPlaying ? 'Stop' : 'Start'}
      onClick={onToggle}
    >
      {isPlaying ? <StopIcon /> : <PlayIcon className="play-icon" />}
    </button>
  );
}
