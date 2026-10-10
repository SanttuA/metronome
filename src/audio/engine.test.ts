import { MetronomeEngine, type EngineSettings } from './engine';

const settings: EngineSettings = { bpm: 120, beatsPerBar: 4, accentFirstBeat: true, volume: 0.5 };

type OnVisualBeat = (beat: number | null) => void;

// Fake timers also drive requestAnimationFrame.
const runFrame = () => vi.advanceTimersToNextFrame();

function setup() {
  const ctx = new AudioContext();
  const onVisualBeat = vi.fn<OnVisualBeat>();
  const engine = new MetronomeEngine(settings, onVisualBeat, () => ctx);
  return { ctx, engine, onVisualBeat };
}

describe('MetronomeEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates the audio context lazily on start', () => {
    const createContext = vi.fn<() => AudioContext>(() => new AudioContext());
    const engine = new MetronomeEngine(settings, vi.fn<OnVisualBeat>(), createContext);
    expect(createContext).not.toHaveBeenCalled();

    engine.start();
    expect(createContext).toHaveBeenCalledOnce();
    expect(engine.isRunning).toBe(true);
    engine.dispose();
  });

  it('reports each beat once the audio clock reaches it', () => {
    const { ctx, engine, onVisualBeat } = setup();
    engine.start();

    runFrame();
    expect(onVisualBeat).not.toHaveBeenCalled();

    Object.assign(ctx, { currentTime: 0.06 });
    runFrame();
    expect(onVisualBeat).toHaveBeenLastCalledWith(0);

    // Let the scheduler queue the next beat (at 0.55 s), then reach it.
    Object.assign(ctx, { currentTime: 0.5 });
    vi.advanceTimersByTime(25);
    Object.assign(ctx, { currentTime: 0.56 });
    runFrame();
    expect(onVisualBeat).toHaveBeenLastCalledWith(1);
    engine.dispose();
  });

  it('clears the visual beat when stopped', () => {
    const { engine, onVisualBeat } = setup();
    engine.start();
    engine.stop();

    expect(engine.isRunning).toBe(false);
    expect(onVisualBeat).toHaveBeenLastCalledWith(null);
  });

  it('closes the audio context on dispose', () => {
    const { ctx, engine } = setup();
    engine.start();
    engine.dispose();
    expect(ctx.close).toHaveBeenCalled();
  });
});
