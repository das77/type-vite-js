import type { LotteryResult, DisplayResult, GameName } from './types.ts';

import powerbballLogo from './assets/Powerball_logo.svg';
import megaLogo from './assets/Mega_Millions.svg';
import euroLogo from './assets/EuroMillions.svg';
import lottoMaxLogo from './assets/Lotto_Max.svg';

export const GAME_LABELS: Record<GameName, string> = {
  powerball: 'Powerball',
  megamillions: 'Mega Millions',
  euromillions: 'EuroMillions',
  lottomax: 'Lotto Max',
};

export const GAME_LOGOS: Record<GameName, string> = {
  powerball: powerbballLogo,
  megamillions: megaLogo,
  euromillions: euroLogo,
  lottomax: lottoMaxLogo,
};

export const getGameOptions = (): Array<[GameName, string]> =>
  Object.entries(GAME_LABELS) as Array<[GameName, string]>;

// 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const DRAW_DAYS: Record<GameName, number[]> = {
  powerball:    [1, 3, 6],
  megamillions: [2, 5],
  euromillions: [2, 5],
  lottomax:     [2, 5],
};

const getNextDrawing = (drawDate: string, game: GameName): string => {
  const [year, month, day] = drawDate.split('-').map(Number);
  const next = new Date(year, month - 1, day + 1);
  const days = DRAW_DAYS[game];
  for (let i = 0; i < 7; i++) {
    if (days.includes(next.getDay())) break;
    next.setDate(next.getDate() + 1);
  }
  return next.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const processResult = (
  { lotteryType, drawDate, numbers, megaBall, jackpot }: LotteryResult,
): DisplayResult => {
  // When the API includes the bonus ball at the end of numbers[], separate it out
  const mainNumbers = megaBall != null ? numbers.slice(0, -1) : numbers;
  const [first, ...rest] = mainNumbers;
  const gameName = lotteryType as GameName;
  return {
    game: gameName,
    date: drawDate,
    numbers: [first, ...rest],
    bonus: megaBall ?? null,
    jackpot: jackpot ?? null,
    formattedDate: formatDate(drawDate),
    nextDrawing: getNextDrawing(drawDate, gameName),
    logoUrl: GAME_LOGOS[gameName],
  };
};

export const summarizeResult = (r: DisplayResult): string => {
  const { game, formattedDate, numbers, bonus, jackpot } = r;
  const bonusPart = bonus != null ? ` | Bonus: ${bonus}` : '';
  const jackpotPart = jackpot != null ? ` | Jackpot: ${jackpot}` : '';
  return `${GAME_LABELS[game]} — ${formattedDate} — ${numbers.join(', ')}${bonusPart}${jackpotPart}`;
};

const formatDate = (iso: string): string => {
  // Split to avoid UTC-to-local offset shifting the date by a day
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
