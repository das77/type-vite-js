import type { RateLimitStatus } from './types.ts';

export interface RateLimiter {
  check: () => RateLimitStatus;
  record: () => void;
}

export const createRateLimiter = (
  limit: number = 5,
  windowMs: number = 60_000,
): RateLimiter => {
  const timestamps: number[] = [];

  const prune = (): void => {
    const cutoff = Date.now() - windowMs;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
  };

  const check = (): RateLimitStatus => {
    prune();
    if (timestamps.length < limit) return { allowed: true, secondsUntilNext: 0 };
    const secondsUntilNext = Math.ceil((timestamps[0] + windowMs - Date.now()) / 1000);
    return { allowed: false, secondsUntilNext };
  };

  const record = (): void => {
    timestamps.push(Date.now());
  };

  return { check, record };
};
