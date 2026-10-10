import { Scheduler, type ScheduledBeat, type SchedulerOptions } from './scheduler';

/** A clock driven by the fake timers, so audio time and timer time move together. */
function createFakeClock() {
  const startedAt = Date.now();
  return {
    get currentTime() {
      return (Date.now() - startedAt) / 1000;
    },
  };
}

function setup(overrides: Partial<SchedulerOptions> = {}) {
  const beats: ScheduledBeat[] = [];
  const scheduler = new Scheduler({
    bpm: 120,
    beatsPerBar: 4,
    accentFirstBeat: true,
    clock: createFakeClock(),
    onBeat: (beat) => beats.push(beat),
    startDelay: 0,
    ...overrides,
  });
  return { scheduler, beats };
}

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules beats 60 / bpm seconds apart', () => {
    const { scheduler, beats } = setup({ bpm: 120 });
    scheduler.start();
    vi.advanceTimersByTime(2000);
    scheduler.stop();

    const times = beats.map((beat) => beat.time);
    expect(times.slice(0, 5)).toEqual([0, 0.5, 1, 1.5, 2]);
  });

  it('only schedules a short way ahead of the clock', () => {
    const { scheduler, beats } = setup({ bpm: 60, lookahead: 0.1 });
    scheduler.start();
    vi.advanceTimersByTime(950);
    expect(beats.map((beat) => beat.time)).toEqual([0, 1]);
    scheduler.stop();
  });

  it('cycles through the bar and accents the first beat', () => {
    const { scheduler, beats } = setup({ beatsPerBar: 3 });
    scheduler.start();
    vi.advanceTimersByTime(3000);
    scheduler.stop();

    expect(beats.slice(0, 7).map((beat) => beat.index)).toEqual([0, 1, 2, 0, 1, 2, 0]);
    expect(beats.slice(0, 4).map((beat) => beat.accent)).toEqual([true, false, false, true]);
  });

  it('does not accent anything when the accent is off', () => {
    const { scheduler, beats } = setup({ accentFirstBeat: false });
    scheduler.start();
    vi.advanceTimersByTime(3000);
    scheduler.stop();

    expect(beats.some((beat) => beat.accent)).toBe(false);
  });

  it('applies a tempo change from the next beat without restarting', () => {
    const { scheduler, beats } = setup({ bpm: 60, lookahead: 0.1 });
    scheduler.start();
    vi.advanceTimersByTime(1000);
    scheduler.configure({ bpm: 120 });
    vi.advanceTimersByTime(1000);
    scheduler.stop();

    // The beat at t=1 was already scheduled; the gap after it uses the new tempo.
    expect(beats.map((beat) => beat.time)).toEqual([0, 1, 1.5, 2]);
  });

  it('wraps to the first beat when the bar gets shorter', () => {
    const { scheduler, beats } = setup({ bpm: 60, beatsPerBar: 4, lookahead: 0.05 });
    scheduler.start();
    vi.advanceTimersByTime(2000);
    scheduler.configure({ beatsPerBar: 2 });
    vi.advanceTimersByTime(3000);
    scheduler.stop();

    expect(beats.map((beat) => beat.index)).toEqual([0, 1, 2, 0, 1, 0]);
  });

  it('stops scheduling after stop()', () => {
    const { scheduler, beats } = setup();
    scheduler.start();
    expect(scheduler.isRunning).toBe(true);
    scheduler.stop();
    const count = beats.length;
    vi.advanceTimersByTime(5000);

    expect(scheduler.isRunning).toBe(false);
    expect(beats).toHaveLength(count);
  });

  it('restarts from the first beat', () => {
    const { scheduler, beats } = setup();
    scheduler.start();
    vi.advanceTimersByTime(1200);
    scheduler.stop();
    beats.length = 0;

    scheduler.start();
    scheduler.stop();
    expect(beats[0]?.index).toBe(0);
  });

  it('skips beats it missed instead of playing them all at once', () => {
    const clock = { currentTime: 0 };
    const beats: ScheduledBeat[] = [];
    const scheduler = new Scheduler({
      bpm: 60,
      beatsPerBar: 4,
      accentFirstBeat: true,
      clock,
      onBeat: (beat) => beats.push(beat),
      startDelay: 0,
    });
    scheduler.start();

    // The timer was frozen while the clock kept running.
    clock.currentTime = 10.95;
    vi.advanceTimersByTime(25);
    scheduler.stop();

    expect(beats.map((beat) => beat.time)).toEqual([0, 11]);
    expect(beats[1]?.index).toBe(3);
  });
});
