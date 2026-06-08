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
  { game, date, numbers, bonus, multiplier }: LotteryResult,
): DisplayResult => {
  const [first, ...rest] = numbers;
  const gameName = game as GameName;
  return {
    game: gameName,
    date,
    numbers: [first, ...rest],
    bonus: bonus ?? null,
    multiplier: multiplier ?? null,
    formattedDate: formatDate(date),
    logoUrl: GAME_LOGOS[gameName],
  };
};

export const summarizeResult = (r: DisplayResult): string => {
  const { game, formattedDate, numbers, bonus, multiplier } = r;
  const bonusPart = bonus != null ? ` | Bonus: ${bonus}` : '';
  const multPart = multiplier != null ? ` | ×${multiplier}` : '';
  return `${GAME_LABELS[game]} — ${formattedDate} — ${numbers.join(', ')}${bonusPart}${multPart}`;
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
