import { clampBpm, isTimeSignatureId, type TimeSignatureId } from './tempo';

/**
 * Parsers for values read back from localStorage. Each returns `undefined` for
 * anything it doesn't recognise so the caller can fall back to a default.
 */

export function parseBpm(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) ? clampBpm(raw) : undefined;
}

export function parseTimeSignature(raw: unknown): TimeSignatureId | undefined {
  return isTimeSignatureId(raw) ? raw : undefined;
}

export function parseBoolean(raw: unknown): boolean | undefined {
  return typeof raw === 'boolean' ? raw : undefined;
}

export function parseVolume(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.min(1, Math.max(0, raw))
    : undefined;
}

export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

export function parseTheme(raw: unknown): Theme | undefined {
  return raw === 'dark' || raw === 'light' ? raw : undefined;
}
