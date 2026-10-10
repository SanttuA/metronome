import { parseBoolean, parseBpm, parseTheme, parseTimeSignature, parseVolume } from './settings';

describe('settings parsers', () => {
  it('parses and clamps the tempo', () => {
    expect(parseBpm(90)).toBe(90);
    expect(parseBpm(5000)).toBe(500);
    expect(parseBpm('90')).toBeUndefined();
  });

  it('parses the time signature', () => {
    expect(parseTimeSignature('7/8')).toBe('7/8');
    expect(parseTimeSignature('9/8')).toBeUndefined();
  });

  it('parses booleans', () => {
    expect(parseBoolean(false)).toBe(false);
    expect(parseBoolean('false')).toBeUndefined();
  });

  it('parses and clamps the volume', () => {
    expect(parseVolume(0.5)).toBe(0.5);
    expect(parseVolume(3)).toBe(1);
    expect(parseVolume(-1)).toBe(0);
    expect(parseVolume(null)).toBeUndefined();
  });

  it('parses the theme', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('blue')).toBeUndefined();
  });
});
