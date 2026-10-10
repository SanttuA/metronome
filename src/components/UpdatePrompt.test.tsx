import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UpdatePrompt } from './UpdatePrompt';

const mocks = vi.hoisted(() => ({
  initial: { needRefresh: false, offlineReady: false },
  updateServiceWorker: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

vi.mock('virtual:pwa-register/react', async () => {
  const { useState } = await import('react');
  return {
    useRegisterSW: () => ({
      needRefresh: useState(mocks.initial.needRefresh),
      offlineReady: useState(mocks.initial.offlineReady),
      updateServiceWorker: mocks.updateServiceWorker,
    }),
  };
});

describe('UpdatePrompt', () => {
  beforeEach(() => {
    mocks.initial = { needRefresh: false, offlineReady: false };
    mocks.updateServiceWorker.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows nothing by default', () => {
    render(<UpdatePrompt />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('says when the app is ready to work offline', async () => {
    const user = userEvent.setup();
    mocks.initial.offlineReady = true;
    render(<UpdatePrompt />);

    expect(screen.getByRole('status')).toHaveTextContent('Ready to work offline.');
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('hides the offline notice by itself', () => {
    vi.useFakeTimers();
    mocks.initial.offlineReady = true;
    render(<UpdatePrompt />);

    act(() => vi.advanceTimersByTime(4900));
    expect(screen.getByRole('status')).toHaveTextContent('Ready to work offline.');
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('keeps the update prompt until the user answers', () => {
    vi.useFakeTimers();
    mocks.initial.needRefresh = true;
    render(<UpdatePrompt />);

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('status')).toHaveTextContent('A new version is available.');
  });

  it('reloads into a new version only when asked', async () => {
    const user = userEvent.setup();
    mocks.initial.needRefresh = true;
    render(<UpdatePrompt />);

    expect(screen.getByRole('status')).toHaveTextContent('A new version is available.');
    expect(mocks.updateServiceWorker).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Reload' }));
    expect(mocks.updateServiceWorker).toHaveBeenCalledOnce();
  });

  it('can postpone an update', async () => {
    const user = userEvent.setup();
    mocks.initial.needRefresh = true;
    render(<UpdatePrompt />);

    await user.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(mocks.updateServiceWorker).not.toHaveBeenCalled();
  });
});
