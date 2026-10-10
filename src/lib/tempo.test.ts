import { MAX_BPM, MIN_BPM, beatsPerBar, clampBpm, isTimeSignatureId, tempoMarking } from './tempo';

describe('clampBpm', () => {
  it.each([
    [120, 120],
    [0, MIN_BPM],
    [-5, MIN_BPM],
    [999, MAX_BPM],
    [99.6, 100],
  ])('clamps %s to %s', (input, expected) => {
    expect(clampBpm(input)).toBe(expected);
  });

  it('falls back to the default for non-finite values', () => {
    expect(clampBpm(Number.NaN)).toBe(120);
    expect(clampBpm(Infinity)).toBe(120);
  });
});

describe('tempoMarking', () => {
  it.each([
    [30, 'Grave'],
    [40, 'Largo'],
    [72, 'Adagio'],
    [90, 'Andante'],
    [112, 'Moderato'],
    [120, 'Allegro'],
    [160, 'Vivace'],
    [180, 'Presto'],
    [240, 'Prestissimo'],
  ])('names %s BPM %s', (bpm, name) => {
    expect(tempoMarking(bpm)).toBe(name);
  });
});

describe('time signatures', () => {
  it('knows how many beats each bar has', () => {
    expect(beatsPerBar('3/4')).toBe(3);
    expect(beatsPerBar('6/8')).toBe(6);
  });

  it('recognises valid ids only', () => {
    expect(isTimeSignatureId('4/4')).toBe(true);
    expect(isTimeSignatureId('4/3')).toBe(false);
    expect(isTimeSignatureId(4)).toBe(false);
  });
});
