import './style.css';
import type { GameName } from './types.ts';
import { createLotteryClient } from './api.ts';
import { createRateLimiter } from './ratelimiter.ts';
import { processResult } from './lottery.ts';
import { LotteryUI } from './ui.ts';

const client = createLotteryClient(import.meta.env.VITE_API_KEY ?? '');
const limiter = createRateLimiter();
const ui = new LotteryUI('#app');

const handleFetch = async (game: GameName): Promise<void> => {
  const { allowed, secondsUntilNext } = limiter.check();
  if (!allowed) {
    ui.setState('rate-limited', secondsUntilNext);
    return;
  }
  ui.setState('loading');
  try {
    limiter.record();
    const response = await client.fetchLottery(game);
    const { data } = response;
    ui.renderResult(processResult(data));
    ui.setState('success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    ui.setState('error', message);
  }
};

ui.onFetch(handleFetch);
