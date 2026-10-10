import { createClickPlayer, type ClickPlayer } from './click';
import { Scheduler, type ScheduledBeat, type SchedulerSettings } from './scheduler';

export interface EngineSettings extends SchedulerSettings {
  volume: number;
}

interface Audio {
  ctx: AudioContext;
  player: ClickPlayer;
  scheduler: Scheduler;
}

/**
 * Owns the AudioContext, the click synth and the scheduler, and reports the
 * beat that is currently sounding so the UI can stay in sync with the audio.
 */
export class MetronomeEngine {
  private settings: EngineSettings;
  private readonly onVisualBeat: (beat: number | null) => void;
  private readonly createContext: () => AudioContext;

  private audio: Audio | undefined;
  private queue: ScheduledBeat[] = [];
  private frame = 0;

  constructor(
    settings: EngineSettings,
    onVisualBeat: (beat: number | null) => void,
    createContext: () => AudioContext = () => new AudioContext(),
  ) {
    this.settings = settings;
    this.onVisualBeat = onVisualBeat;
    this.createContext = createContext;
  }

  get isRunning(): boolean {
    return this.audio?.scheduler.isRunning ?? false;
  }

  /** Must be called from a user gesture so the browser allows audio. */
  start(): void {
    if (this.isRunning) return;
    const audio = (this.audio ??= this.initAudio());
    void audio.ctx.resume();
    audio.scheduler.start();
    this.frame = requestAnimationFrame(this.draw);
  }

  stop(): void {
    if (!this.audio) return;
    this.audio.scheduler.stop();
    this.audio.player.cancelPending();
    cancelAnimationFrame(this.frame);
    this.queue = [];
    this.onVisualBeat(null);
  }

  update(settings: EngineSettings): void {
    this.settings = settings;
    if (!this.audio) return;
    this.audio.scheduler.configure(settings);
    this.audio.player.setVolume(settings.volume);
  }

  dispose(): void {
    this.stop();
    void this.audio?.ctx.close();
    this.audio = undefined;
  }

  private initAudio(): Audio {
    const ctx = this.createContext();
    const player = createClickPlayer(ctx, this.settings.volume);
    const scheduler = new Scheduler({
      ...this.settings,
      clock: ctx,
      onBeat: (beat) => {
        player.play(beat.time, beat.accent);
        this.queue.push(beat);
      },
    });
    return { ctx, player, scheduler };
  }

  private readonly draw = (): void => {
    if (!this.audio) return;
    const now = this.audio.ctx.currentTime;
    let latest: ScheduledBeat | undefined;
    while (this.queue[0] && this.queue[0].time <= now) latest = this.queue.shift();
    if (latest) this.onVisualBeat(latest.index);
    this.frame = requestAnimationFrame(this.draw);
  };
}
