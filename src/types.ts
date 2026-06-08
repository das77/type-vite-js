export type GameName = 'powerball' | 'megamillions' | 'euromillions' | 'lottomax';

export type FetchState = 'idle' | 'loading' | 'success' | 'error' | 'rate-limited';

export interface LotteryResult {
  game: string;
  date: string;
  numbers: number[];
  bonus: number | null;
  multiplier: string | null;
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
  multiplier: string | null;
  formattedDate: string;
  logoUrl: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  secondsUntilNext: number;
}
