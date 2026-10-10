/** Anything with an audio-clock style `currentTime` in seconds, e.g. an AudioContext. */
export interface Clock {
  readonly currentTime: number;
}

export interface ScheduledBeat {
  /** Position of the beat within the bar, starting from 0. */
  readonly index: number;
  /** Clock time (seconds) at which the beat should sound. */
  readonly time: number;
  readonly accent: boolean;
}

export interface SchedulerSettings {
  bpm: number;
  beatsPerBar: number;
  accentFirstBeat: boolean;
}

export interface SchedulerOptions extends SchedulerSettings {
  clock: Clock;
  onBeat: (beat: ScheduledBeat) => void;
  /** How far ahead of the clock to schedule beats, in seconds. */
  lookahead?: number;
  /** How often to check whether more beats need scheduling, in milliseconds. */
  interval?: number;
  /** Delay before the first beat after `start()`, in seconds. */
  startDelay?: number;
}

/**
 * Lookahead scheduler ("A Tale of Two Clocks"): a coarse JS timer repeatedly
 * schedules every beat that falls inside the next `lookahead` seconds on the
 * precise audio clock, so timing never depends on when the timer fires.
 */
export class Scheduler {
  private settings: SchedulerSettings;
  private readonly clock: Clock;
  private readonly onBeat: (beat: ScheduledBeat) => void;
  private readonly lookahead: number;
  private readonly interval: number;
  private readonly startDelay: number;

  private timer: ReturnType<typeof setInterval> | undefined;
  private nextBeatTime = 0;
  private nextBeatIndex = 0;

  constructor(options: SchedulerOptions) {
    this.settings = {
      bpm: options.bpm,
      beatsPerBar: options.beatsPerBar,
      accentFirstBeat: options.accentFirstBeat,
    };
    this.clock = options.clock;
    this.onBeat = options.onBeat;
    this.lookahead = options.lookahead ?? 0.1;
    this.interval = options.interval ?? 25;
    this.startDelay = options.startDelay ?? 0.05;
  }

  get isRunning(): boolean {
    return this.timer !== undefined;
  }

  start(): void {
    if (this.isRunning) return;
    this.nextBeatIndex = 0;
    this.nextBeatTime = this.clock.currentTime + this.startDelay;
    this.timer = setInterval(() => this.tick(), this.interval);
    this.tick();
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Changes take effect from the next unscheduled beat, without restarting. */
  configure(settings: Partial<SchedulerSettings>): void {
    const previousSecondsPerBeat = this.secondsPerBeat;
    this.settings = { ...this.settings, ...settings };

    if (this.isRunning && this.secondsPerBeat !== previousSecondsPerBeat) {
      // Re-time the gap after the last scheduled beat using the new tempo.
      const lastBeatTime = this.nextBeatTime - previousSecondsPerBeat;
      this.nextBeatTime = Math.max(lastBeatTime + this.secondsPerBeat, this.clock.currentTime);
    }
    if (this.nextBeatIndex >= this.settings.beatsPerBar) this.nextBeatIndex = 0;
  }

  private get secondsPerBeat(): number {
    return 60 / this.settings.bpm;
  }

  private tick(): void {
    const now = this.clock.currentTime;

    // If the timer was starved (e.g. a frozen tab), skip missed beats instead
    // of firing them all at once.
    if (this.nextBeatTime < now) {
      const missed = Math.ceil((now - this.nextBeatTime) / this.secondsPerBeat);
      this.nextBeatTime += missed * this.secondsPerBeat;
      this.nextBeatIndex = (this.nextBeatIndex + missed) % this.settings.beatsPerBar;
    }

    while (this.nextBeatTime < now + this.lookahead) {
      this.onBeat({
        index: this.nextBeatIndex,
        time: this.nextBeatTime,
        accent: this.settings.accentFirstBeat && this.nextBeatIndex === 0,
      });
      this.nextBeatTime += this.secondsPerBeat;
      this.nextBeatIndex = (this.nextBeatIndex + 1) % this.settings.beatsPerBar;
    }
  }
}
