import '@testing-library/jest-dom/vitest';

/** Minimal Web Audio stand-in: jsdom has no audio support. */
function fakeParam() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  };
}

function fakeNode() {
  return {
    connect: vi.fn((destination: unknown) => destination),
    disconnect: vi.fn(),
  };
}

class FakeAudioContext {
  currentTime = 0;
  destination = fakeNode();
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());

  createGain() {
    return { ...fakeNode(), gain: fakeParam() };
  }

  createOscillator() {
    return {
      ...fakeNode(),
      frequency: fakeParam(),
      addEventListener: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
}

vi.stubGlobal('AudioContext', FakeAudioContext);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset['theme'] = 'dark';
});
