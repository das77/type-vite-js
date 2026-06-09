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
