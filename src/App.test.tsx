import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from './App';

function bpmInput() {
  return screen.getByRole('textbox', { name: /tempo in beats per minute/i });
}

function beatDots() {
  return screen.getByTestId('beat-indicator').querySelectorAll('li');
}

describe('App', () => {
  it('starts at 120 BPM in 4/4 with the dark theme', () => {
    render(<App />);

    expect(bpmInput()).toHaveValue('120');
    expect(screen.getByTestId('tempo-marking')).toHaveTextContent('Allegro');
    expect(beatDots()).toHaveLength(4);
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('changes the tempo with the − and + buttons', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Increase tempo' }));
    await user.click(screen.getByRole('button', { name: 'Increase tempo' }));
    expect(bpmInput()).toHaveValue('122');

    await user.click(screen.getByRole('button', { name: 'Decrease tempo' }));
    expect(bpmInput()).toHaveValue('121');
  });

  it('changes the tempo with the slider', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('slider', { name: 'Tempo' }), { target: { value: '60' } });
    expect(bpmInput()).toHaveValue('60');
    expect(screen.getByTestId('tempo-marking')).toHaveTextContent('Larghetto');
  });

  it('accepts a typed tempo and clamps it to the allowed range', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(bpmInput());
    await user.type(bpmInput(), '95{Enter}');
    expect(bpmInput()).toHaveValue('95');

    await user.clear(bpmInput());
    await user.type(bpmInput(), '999{Enter}');
    expect(bpmInput()).toHaveValue('500');
  });

  it('discards an empty typed tempo', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(bpmInput());
    await user.tab();
    expect(bpmInput()).toHaveValue('120');
  });

  it('cancels a typed tempo with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(bpmInput());
    await user.type(bpmInput(), '60{Escape}');
    expect(bpmInput()).toHaveValue('120');
  });

  it('steps the typed tempo with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(bpmInput());
    await user.keyboard('{ArrowUp}');
    expect(bpmInput()).toHaveValue('121');
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(bpmInput()).toHaveValue('111');
  });

  it('changes the volume', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('slider', { name: /volume/i }), { target: { value: '0.4' } });
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(localStorage.getItem('metronome.volume')).toBe('0.4');
  });

  it('disables the buttons at the tempo limits', () => {
    localStorage.setItem('metronome.bpm', '500');
    render(<App />);

    expect(screen.getByRole('button', { name: 'Increase tempo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease tempo' })).toBeEnabled();
  });

  it('shows one dot per beat of the chosen time signature', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Time signature' }), '7/8');
    expect(beatDots()).toHaveLength(7);
  });

  it('marks the first beat as accented unless the accent is turned off', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(beatDots()[0]).toHaveAttribute('data-accent', 'true');
    await user.click(screen.getByRole('switch', { name: 'Accent first beat' }));
    expect(beatDots()[0]).toHaveAttribute('data-accent', 'false');
  });

  it('starts and stops with the play button', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  describe('keyboard shortcuts', () => {
    it('toggles playback with Space', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('does not double-toggle when Space is pressed on the focused play button', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Start' }));
      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('nudges the tempo with the arrow keys', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard('{ArrowUp}{ArrowUp}');
      expect(bpmInput()).toHaveValue('122');
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
      expect(bpmInput()).toHaveValue('112');
    });

    it('leaves keys alone while a form field has focus', async () => {
      const user = userEvent.setup();
      render(<App />);

      screen.getByRole('combobox', { name: 'Time signature' }).focus();
      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });
  });

  describe('persistence', () => {
    it('restores saved settings', () => {
      localStorage.setItem('metronome.bpm', '88');
      localStorage.setItem('metronome.timeSignature', '"3/4"');
      localStorage.setItem('metronome.volume', '0.25');
      render(<App />);

      expect(bpmInput()).toHaveValue('88');
      expect(beatDots()).toHaveLength(3);
      expect(screen.getByRole('slider', { name: /volume/i })).toHaveValue('0.25');
    });

    it('saves changes', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Increase tempo' }));
      await user.selectOptions(screen.getByRole('combobox', { name: 'Time signature' }), '6/8');

      expect(localStorage.getItem('metronome.bpm')).toBe('121');
      expect(localStorage.getItem('metronome.timeSignature')).toBe('"6/8"');
    });
  });

  describe('theme', () => {
    it('toggles between dark and light and remembers the choice', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
      expect(document.documentElement.dataset['theme']).toBe('light');
      expect(localStorage.getItem('metronome.theme')).toBe('"light"');

      await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
      expect(document.documentElement.dataset['theme']).toBe('dark');
    });

    it('restores a saved light theme', () => {
      localStorage.setItem('metronome.theme', '"light"');
      render(<App />);
      expect(document.documentElement.dataset['theme']).toBe('light');
    });

    it('keeps the browser theme colour in sync', async () => {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
      const user = userEvent.setup();
      render(<App />);

      expect(meta.content).toBe('#0e0d14');
      await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
      expect(meta.content).toBe('#f3f2f8');
      meta.remove();
    });
  });
});
