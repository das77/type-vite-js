export type GameName = 'powerball' | 'megamillions' | 'euromillions' | 'lottomax';

export type FetchState = 'idle' | 'loading' | 'success' | 'error' | 'rate-limited';

export interface LotteryResult {
  lotteryType: string;
  drawDate: string;
  numbers: number[];
  megaBall?: number | null;
  jackpot?: string | null;
}

export interface ApiResponse<T> {
  status: string;
  code: number;
  data: T;
}

export interface DisplayResult {
  game: GameName;
  date: string;
  numbers: number[];
  bonus: number | null;
  jackpot: string | null;
  formattedDate: string;
  logoUrl: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  secondsUntilNext: number;
}
