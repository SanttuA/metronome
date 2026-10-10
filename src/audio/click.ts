const ACCENT_FREQUENCY = 1600;
const BEAT_FREQUENCY = 1000;
const CLICK_DURATION = 0.05;
const SILENT = 0.0001;

export interface ClickPlayer {
  play(time: number, accent: boolean): void;
  setVolume(volume: number): void;
  /** Silences clicks that are scheduled but haven't finished playing yet. */
  cancelPending(): void;
}

/** Synthesizes short percussive clicks, so no audio files are needed. */
export function createClickPlayer(ctx: BaseAudioContext, volume: number): ClickPlayer {
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  const pending = new Set<OscillatorNode>();

  return {
    play(time, accent) {
      const osc = ctx.createOscillator();
      const envelope = ctx.createGain();
      osc.frequency.value = accent ? ACCENT_FREQUENCY : BEAT_FREQUENCY;

      const peak = accent ? 1 : 0.6;
      envelope.gain.setValueAtTime(SILENT, time);
      envelope.gain.exponentialRampToValueAtTime(peak, time + 0.002);
      envelope.gain.exponentialRampToValueAtTime(SILENT, time + CLICK_DURATION);

      osc.connect(envelope).connect(master);
      osc.addEventListener('ended', () => {
        pending.delete(osc);
        envelope.disconnect();
      });
      pending.add(osc);
      osc.start(time);
      osc.stop(time + CLICK_DURATION + 0.01);
    },

    setVolume(nextVolume) {
      master.gain.setTargetAtTime(nextVolume, ctx.currentTime, 0.01);
    },

    cancelPending() {
      for (const osc of pending) osc.stop();
      pending.clear();
    },
  };
}
