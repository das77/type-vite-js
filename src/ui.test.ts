// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./lottery.ts', () => ({
  getGameOptions: () => [
    ['powerball', 'Powerball'],
    ['megamillions', 'Mega Millions'],
  ] as Array<[string, string]>,
  GAME_LABELS: { powerball: 'Powerball', megamillions: 'Mega Millions' },
  summarizeResult: () => 'Powerball — January 3, 2026 — 1, 2, 3, 4, 5',
}));

import { LotteryUI } from './ui.ts';
import type { DisplayResult } from './types.ts';

const makeResult = (overrides: Partial<DisplayResult> = {}): DisplayResult => ({
  game: 'powerball',
  date: '2026-01-03',
  numbers: [1, 2, 3, 4, 5],
  bonus: null,
  jackpot: null,
  formattedDate: 'January 3, 2026',
  nextDrawing: 'Monday, January 5, 2026',
  logoUrl: '/powerball.svg',
  ...overrides,
});

describe('LotteryUI', () => {
  let container: HTMLDivElement;
  let ui: LotteryUI;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    ui = new LotteryUI('#app');
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── Constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('injects the app shell into the root element', () => {
      expect(container.querySelector('#game-select')).not.toBeNull();
      expect(container.querySelector('#fetch-btn')).not.toBeNull();
      expect(container.querySelector('#results')).not.toBeNull();
      expect(container.querySelector('#status')).not.toBeNull();
    });

    it('populates the select with one option per game', () => {
      const select = container.querySelector<HTMLSelectElement>('#game-select')!;
      expect(select.options.length).toBe(2);
      expect(select.options[0].value).toBe('powerball');
      expect(select.options[0].textContent).toBe('Powerball');
      expect(select.options[1].value).toBe('megamillions');
    });

    it('status element starts with data-state="idle"', () => {
      const status = container.querySelector<HTMLDivElement>('#status')!;
      expect(status.dataset['state']).toBe('idle');
    });
  });

  // ── setState ─────────────────────────────────────────────────────────────

  describe('setState', () => {
    it('sets the data-state attribute for loading', () => {
      ui.setState('loading');
      expect(container.querySelector('#status')!.getAttribute('data-state')).toBe('loading');
    });

    it('sets the data-state attribute for success', () => {
      ui.setState('success');
      expect(container.querySelector('#status')!.getAttribute('data-state')).toBe('success');
    });

    it('sets the data-state attribute for error', () => {
      ui.setState('error', 'Something failed');
      expect(container.querySelector('#status')!.getAttribute('data-state')).toBe('error');
    });

    it('disables the button in loading state', () => {
      ui.setState('loading');
      expect(container.querySelector<HTMLButtonElement>('#fetch-btn')!.disabled).toBe(true);
    });

    it('disables the button in rate-limited state', () => {
      ui.setState('rate-limited', 30);
      expect(container.querySelector<HTMLButtonElement>('#fetch-btn')!.disabled).toBe(true);
    });

    it('enables the button when returning to idle', () => {
      ui.setState('loading');
      ui.setState('idle');
      expect(container.querySelector<HTMLButtonElement>('#fetch-btn')!.disabled).toBe(false);
    });

    it('shows error message text', () => {
      ui.setState('error', 'API unavailable');
      expect(container.querySelector('#status')!.textContent).toContain('API unavailable');
    });

    it('shows a default error message when none is supplied', () => {
      ui.setState('error');
      expect(container.querySelector('#status')!.textContent).toContain('An error occurred');
    });

    it('clears status text when transitioning to a non-error state', () => {
      ui.setState('error', 'oops');
      ui.setState('success');
      expect(container.querySelector('#status')!.textContent).toBe('');
    });

    it('restores button text when leaving rate-limited state', () => {
      vi.useFakeTimers();
      ui.setState('rate-limited', 10);
      ui.setState('idle');
      expect(container.querySelector<HTMLButtonElement>('#fetch-btn')!.textContent).toBe('Fetch Results');
    });
  });

  // ── Countdown timer ───────────────────────────────────────────────────────

  describe('countdown timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('shows the initial seconds in the status text', () => {
      ui.setState('rate-limited', 30);
      expect(container.querySelector('#status')!.textContent).toContain('30s');
    });

    it('shows the initial seconds in the button text', () => {
      ui.setState('rate-limited', 30);
      expect(container.querySelector<HTMLButtonElement>('#fetch-btn')!.textContent).toContain('30s');
    });

    it('decrements by 1 after one second', () => {
      ui.setState('rate-limited', 30);
      vi.advanceTimersByTime(1000);
      expect(container.querySelector('#status')!.textContent).toContain('29s');
    });

    it('resets to idle once the countdown expires', () => {
      ui.setState('rate-limited', 1);
      vi.advanceTimersByTime(1000);
      expect(container.querySelector('#status')!.getAttribute('data-state')).toBe('idle');
    });

    it('cancels a running countdown when setState is called again', () => {
      const status = container.querySelector<HTMLDivElement>('#status')!;
      ui.setState('rate-limited', 60);
      vi.advanceTimersByTime(500);
      ui.setState('idle');
      // Advance past where the original countdown would have fired
      vi.advanceTimersByTime(5000);
      expect(status.dataset['state']).toBe('idle');
    });
  });

  // ── renderResult ──────────────────────────────────────────────────────────

  describe('renderResult', () => {
    it('renders the game logo with correct src and alt', () => {
      ui.renderResult(makeResult({ logoUrl: '/powerball.svg', game: 'powerball' }));
      const img = container.querySelector<HTMLImageElement>('.game-logo')!;
      expect(img.src).toContain('/powerball.svg');
      expect(img.alt).toBe('Powerball');
    });

    it('renders the formatted draw date', () => {
      ui.renderResult(makeResult({ formattedDate: 'January 3, 2026' }));
      expect(container.querySelector('.result-date')!.textContent).toBe('January 3, 2026');
    });

    it('renders the correct number of main balls', () => {
      ui.renderResult(makeResult({ numbers: [1, 2, 3, 4, 5] }));
      const balls = container.querySelectorAll('.ball:not(.bonus)');
      expect(balls.length).toBe(5);
    });

    it('renders ball values as text content', () => {
      ui.renderResult(makeResult({ numbers: [10, 20, 30] }));
      const balls = container.querySelectorAll('.ball:not(.bonus)');
      expect(balls[0].textContent).toBe('10');
      expect(balls[1].textContent).toBe('20');
      expect(balls[2].textContent).toBe('30');
    });

    it('renders a bonus ball with the bonus class when present', () => {
      ui.renderResult(makeResult({ bonus: 5 }));
      const bonusBall = container.querySelector('.ball.bonus')!;
      expect(bonusBall).not.toBeNull();
      expect(bonusBall.textContent).toBe('5');
    });

    it('renders no bonus ball when bonus is null', () => {
      ui.renderResult(makeResult({ bonus: null }));
      expect(container.querySelector('.ball.bonus')).toBeNull();
    });

    it('renders the jackpot badge with Estimated Jackpot label', () => {
      ui.renderResult(makeResult({ jackpot: '$100 Million' }));
      const badge = container.querySelector('.multiplier-badge')!;
      expect(badge.textContent).toContain('Estimated Jackpot');
      expect(badge.textContent).toContain('$100 Million');
    });

    it('renders no jackpot badge when jackpot is null', () => {
      ui.renderResult(makeResult({ jackpot: null }));
      expect(container.querySelector('.multiplier-badge')).toBeNull();
    });

    it('renders the next drawing line', () => {
      ui.renderResult(makeResult({ nextDrawing: 'Monday, January 5, 2026' }));
      expect(container.querySelector('.next-drawing')!.textContent).toContain('Monday, January 5, 2026');
    });

    it('sets aria-label on the result card', () => {
      ui.renderResult(makeResult());
      const card = container.querySelector('.result-card')!;
      expect(card.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ── onFetch ───────────────────────────────────────────────────────────────

  describe('onFetch', () => {
    it('calls the callback with the selected game value on button click', async () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      ui.onFetch(callback);

      const select = container.querySelector<HTMLSelectElement>('#game-select')!;
      select.value = 'megamillions';
      container.querySelector<HTMLButtonElement>('#fetch-btn')!.click();

      expect(callback).toHaveBeenCalledWith('megamillions');
    });

    it('calls the callback with the default first option when nothing is changed', () => {
      const callback = vi.fn().mockResolvedValue(undefined);
      ui.onFetch(callback);
      container.querySelector<HTMLButtonElement>('#fetch-btn')!.click();
      expect(callback).toHaveBeenCalledWith('powerball');
    });
  });
});
