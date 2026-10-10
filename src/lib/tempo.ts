export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 120;

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

/** Upper bounds (exclusive) for the traditional Italian tempo markings. */
const TEMPO_MARKINGS: ReadonlyArray<readonly [maxBpm: number, name: string]> = [
  [40, 'Grave'],
  [60, 'Largo'],
  [66, 'Larghetto'],
  [76, 'Adagio'],
  [108, 'Andante'],
  [120, 'Moderato'],
  [156, 'Allegro'],
  [176, 'Vivace'],
  [200, 'Presto'],
  [Infinity, 'Prestissimo'],
];

export function tempoMarking(bpm: number): string {
  const match = TEMPO_MARKINGS.find(([maxBpm]) => bpm < maxBpm);
  return match ? match[1] : 'Prestissimo';
}

export const TIME_SIGNATURES = [
  { id: '2/4', beats: 2 },
  { id: '3/4', beats: 3 },
  { id: '4/4', beats: 4 },
  { id: '5/4', beats: 5 },
  { id: '6/8', beats: 6 },
  { id: '7/8', beats: 7 },
] as const;

export type TimeSignatureId = (typeof TIME_SIGNATURES)[number]['id'];

export const DEFAULT_TIME_SIGNATURE: TimeSignatureId = '4/4';

export function isTimeSignatureId(value: unknown): value is TimeSignatureId {
  return TIME_SIGNATURES.some((signature) => signature.id === value);
}

export function beatsPerBar(id: TimeSignatureId): number {
  return TIME_SIGNATURES.find((signature) => signature.id === id)?.beats ?? 4;
}
