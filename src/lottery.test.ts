import { describe, it, expect, vi } from 'vitest';

// Vitest hoists vi.mock calls — these run before the imports below
vi.mock('./assets/Powerball_logo.svg', () => ({ default: '/powerball.svg' }));
vi.mock('./assets/Mega_Millions.svg', () => ({ default: '/megamillions.svg' }));
vi.mock('./assets/EuroMillions.svg', () => ({ default: '/euromillions.svg' }));
vi.mock('./assets/Lotto_Max.svg', () => ({ default: '/lottomax.svg' }));

import {
  GAME_LABELS,
  GAME_LOGOS,
  getGameOptions,
  processResult,
  summarizeResult,
} from './lottery.ts';

// Verified calendar: Jan 1 2026 = Thursday
// Jan 3 = Sat, Jan 5 = Mon, Jan 6 = Tue, Jan 7 = Wed, Jan 9 = Fri

describe('GAME_LABELS', () => {
  it('has correct labels for all four games', () => {
    expect(GAME_LABELS.powerball).toBe('Powerball');
    expect(GAME_LABELS.megamillions).toBe('Mega Millions');
    expect(GAME_LABELS.euromillions).toBe('EuroMillions');
    expect(GAME_LABELS.lottomax).toBe('Lotto Max');
  });
});

describe('GAME_LOGOS', () => {
  it('maps each game to its mocked asset URL', () => {
    expect(GAME_LOGOS.powerball).toBe('/powerball.svg');
    expect(GAME_LOGOS.megamillions).toBe('/megamillions.svg');
    expect(GAME_LOGOS.euromillions).toBe('/euromillions.svg');
    expect(GAME_LOGOS.lottomax).toBe('/lottomax.svg');
  });
});

describe('getGameOptions', () => {
  it('returns exactly four [GameName, label] pairs', () => {
    const opts = getGameOptions();
    expect(opts).toHaveLength(4);
  });

  it('contains all four game entries', () => {
    const opts = getGameOptions();
    expect(opts).toContainEqual(['powerball', 'Powerball']);
    expect(opts).toContainEqual(['megamillions', 'Mega Millions']);
    expect(opts).toContainEqual(['euromillions', 'EuroMillions']);
    expect(opts).toContainEqual(['lottomax', 'Lotto Max']);
  });
});

describe('processResult', () => {
  describe('number splitting', () => {
    it('separates megaBall from main numbers when megaBall is present', () => {
      const result = processResult({
        lotteryType: 'megamillions',
        drawDate: '2026-02-04',
        numbers: [10, 50, 55, 58, 59, 5],
        megaBall: 5,
        jackpot: '$70 Million',
      });
      expect(result.numbers).toEqual([10, 50, 55, 58, 59]);
      expect(result.bonus).toBe(5);
    });

    it('keeps all numbers as main when megaBall is null', () => {
      const result = processResult({
        lotteryType: 'powerball',
        drawDate: '2026-01-03',
        numbers: [5, 12, 23, 34, 45],
        megaBall: null,
      });
      expect(result.numbers).toEqual([5, 12, 23, 34, 45]);
      expect(result.bonus).toBeNull();
    });

    it('keeps all numbers as main when megaBall is undefined', () => {
      const result = processResult({
        lotteryType: 'euromillions',
        drawDate: '2026-01-06',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(result.numbers).toEqual([1, 2, 3, 4, 5]);
      expect(result.bonus).toBeNull();
    });
  });

  describe('jackpot', () => {
    it('preserves jackpot string when provided', () => {
      const result = processResult({
        lotteryType: 'megamillions',
        drawDate: '2026-02-04',
        numbers: [1, 2, 3, 4, 5, 6],
        megaBall: 6,
        jackpot: '$70 Million',
      });
      expect(result.jackpot).toBe('$70 Million');
    });

    it('returns null jackpot when field is absent', () => {
      const result = processResult({
        lotteryType: 'powerball',
        drawDate: '2026-01-03',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(result.jackpot).toBeNull();
    });

    it('returns null jackpot when field is null', () => {
      const result = processResult({
        lotteryType: 'powerball',
        drawDate: '2026-01-03',
        numbers: [1, 2, 3, 4, 5],
        jackpot: null,
      });
      expect(result.jackpot).toBeNull();
    });
  });

  describe('date formatting', () => {
    it('formats date as Month D, YYYY', () => {
      const result = processResult({
        lotteryType: 'megamillions',
        drawDate: '2026-02-04',
        numbers: [1, 2, 3, 4, 5, 6],
        megaBall: 6,
      });
      expect(result.formattedDate).toContain('February');
      expect(result.formattedDate).toContain('4');
      expect(result.formattedDate).toContain('2026');
    });

    it('does not shift date due to UTC offset', () => {
      // A naive new Date("2026-02-04") would render as Feb 3 in UTC-offset timezones
      const result = processResult({
        lotteryType: 'megamillions',
        drawDate: '2026-02-04',
        numbers: [1, 2, 3, 4, 5, 6],
        megaBall: 6,
      });
      expect(result.formattedDate).not.toMatch(/February\s+3/);
    });
  });

  describe('logo URL', () => {
    it('resolves the correct logo for each game', () => {
      const games = [
        { type: 'powerball', logo: '/powerball.svg', numbers: [1, 2, 3, 4, 5] },
        { type: 'megamillions', logo: '/megamillions.svg', numbers: [1, 2, 3, 4, 5, 6], megaBall: 6 },
        { type: 'euromillions', logo: '/euromillions.svg', numbers: [1, 2, 3, 4, 5] },
        { type: 'lottomax', logo: '/lottomax.svg', numbers: [1, 2, 3, 4, 5] },
      ] as const;

      for (const { type, logo, numbers, ...rest } of games) {
        const result = processResult({ lotteryType: type, drawDate: '2026-01-06', numbers, ...rest });
        expect(result.logoUrl).toBe(logo);
      }
    });
  });
});

describe('getNextDrawing', () => {
  describe('Powerball — Mon / Wed / Sat', () => {
    it('Saturday draw → next is Monday', () => {
      // 2026-01-03 is a Saturday
      const { nextDrawing } = processResult({
        lotteryType: 'powerball',
        drawDate: '2026-01-03',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(nextDrawing).toContain('Monday');
      expect(nextDrawing).toContain('January 5, 2026');
    });

    it('Monday draw → next is Wednesday', () => {
      // 2026-01-05 is a Monday
      const { nextDrawing } = processResult({
        lotteryType: 'powerball',
        drawDate: '2026-01-05',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(nextDrawing).toContain('Wednesday');
      expect(nextDrawing).toContain('January 7, 2026');
    });

    it('Wednesday draw → next is Saturday', () => {
      // 2026-01-07 is a Wednesday
      const { nextDrawing } = processResult({
        lotteryType: 'powerball',
        drawDate: '2026-01-07',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(nextDrawing).toContain('Saturday');
      expect(nextDrawing).toContain('January 10, 2026');
    });
  });

  describe('Mega Millions — Tue / Fri', () => {
    it('Tuesday draw → next is Friday', () => {
      // 2026-01-06 is a Tuesday
      const { nextDrawing } = processResult({
        lotteryType: 'megamillions',
        drawDate: '2026-01-06',
        numbers: [1, 2, 3, 4, 5, 6],
        megaBall: 6,
      });
      expect(nextDrawing).toContain('Friday');
      expect(nextDrawing).toContain('January 9, 2026');
    });

    it('Friday draw → next is Tuesday', () => {
      // 2026-01-09 is a Friday
      const { nextDrawing } = processResult({
        lotteryType: 'megamillions',
        drawDate: '2026-01-09',
        numbers: [1, 2, 3, 4, 5, 6],
        megaBall: 6,
      });
      expect(nextDrawing).toContain('Tuesday');
      expect(nextDrawing).toContain('January 13, 2026');
    });
  });

  describe('EuroMillions — Tue / Fri', () => {
    it('Tuesday draw → next is Friday', () => {
      const { nextDrawing } = processResult({
        lotteryType: 'euromillions',
        drawDate: '2026-01-06',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(nextDrawing).toContain('Friday');
    });
  });

  describe('Lotto Max — Tue / Fri', () => {
    it('Friday draw → next is Tuesday', () => {
      const { nextDrawing } = processResult({
        lotteryType: 'lottomax',
        drawDate: '2026-01-09',
        numbers: [1, 2, 3, 4, 5],
      });
      expect(nextDrawing).toContain('Tuesday');
    });
  });
});

describe('summarizeResult', () => {
  it('includes the game label, formatted date, and numbers', () => {
    const result = processResult({
      lotteryType: 'powerball',
      drawDate: '2026-01-03',
      numbers: [1, 2, 3, 4, 5],
    });
    const summary = summarizeResult(result);
    expect(summary).toContain('Powerball');
    expect(summary).toContain('January 3, 2026');
    expect(summary).toContain('1, 2, 3, 4, 5');
  });

  it('appends bonus ball when present', () => {
    const result = processResult({
      lotteryType: 'megamillions',
      drawDate: '2026-02-04',
      numbers: [10, 50, 55, 58, 59, 5],
      megaBall: 5,
    });
    expect(summarizeResult(result)).toContain('Bonus: 5');
  });

  it('appends jackpot when present', () => {
    const result = processResult({
      lotteryType: 'megamillions',
      drawDate: '2026-02-04',
      numbers: [10, 50, 55, 58, 59, 5],
      megaBall: 5,
      jackpot: '$70 Million',
    });
    expect(summarizeResult(result)).toContain('$70 Million');
  });

  it('omits bonus and jackpot sections when absent', () => {
    const result = processResult({
      lotteryType: 'powerball',
      drawDate: '2026-01-03',
      numbers: [1, 2, 3, 4, 5],
    });
    const summary = summarizeResult(result);
    expect(summary).not.toContain('Bonus');
    expect(summary).not.toContain('Jackpot');
  });
});
