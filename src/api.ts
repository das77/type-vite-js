import type { ApiResponse, LotteryResult, GameName } from './types.ts';

export interface LotteryClient {
  fetchLottery: (game: GameName) => Promise<ApiResponse<LotteryResult>>;
}

export const createLotteryClient = (
  apiKey: string,
  baseUrl: string = 'https://api.apiverve.com/v1',
): LotteryClient => {
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const fetchLottery = async (game: GameName): Promise<ApiResponse<LotteryResult>> => {
    const res = await fetch(`${baseUrl}/lottery?numbers=${game}`, {
      headers: { ...defaultHeaders, 'x-api-key': apiKey },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { message?: string } | null;
      throw new Error(body?.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<ApiResponse<LotteryResult>>;
  };

  return { fetchLottery };
};
