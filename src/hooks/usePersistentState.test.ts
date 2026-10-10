import { act, renderHook } from '@testing-library/react';

import { parseBpm } from '../lib/settings';
import { readStoredValue, usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  it('uses the fallback when nothing is stored', () => {
    const { result } = renderHook(() => usePersistentState('bpm', 100, parseBpm));
    expect(result.current[0]).toBe(100);
  });

  it('loads a stored value', () => {
    localStorage.setItem('bpm', '72');
    const { result } = renderHook(() => usePersistentState('bpm', 100, parseBpm));
    expect(result.current[0]).toBe(72);
  });

  it('saves updates', () => {
    const { result } = renderHook(() => usePersistentState('bpm', 100, parseBpm));
    act(() => result.current[1](140));

    expect(result.current[0]).toBe(140);
    expect(localStorage.getItem('bpm')).toBe('140');
  });

  it('falls back on corrupt or invalid data', () => {
    localStorage.setItem('bpm', '{not json');
    expect(readStoredValue('bpm', 100, parseBpm)).toBe(100);

    localStorage.setItem('bpm', '"fast"');
    expect(readStoredValue('bpm', 100, parseBpm)).toBe(100);
  });

  it('falls back when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const { result } = renderHook(() => usePersistentState('bpm', 100, parseBpm));
    expect(result.current[0]).toBe(100);
    expect(() => act(() => result.current[1](110))).not.toThrow();
  });
});
