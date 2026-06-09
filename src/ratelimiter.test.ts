import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from './ratelimiter.ts';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows a request when no calls have been recorded', () => {
    const limiter = createRateLimiter(5, 60_000);
    expect(limiter.check()).toEqual({ allowed: true, secondsUntilNext: 0 });
  });

  it('allows requests up to the limit', () => {
    const limiter = createRateLimiter(3, 60_000);
    limiter.record();
    limiter.record();
    expect(limiter.check().allowed).toBe(true);
  });

  it('blocks when the limit is reached', () => {
    const limiter = createRateLimiter(3, 60_000);
    limiter.record();
    limiter.record();
    limiter.record();
    expect(limiter.check().allowed).toBe(false);
  });

  it('returns secondsUntilNext > 0 when blocked', () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.record();
    const { allowed, secondsUntilNext } = limiter.check();
    expect(allowed).toBe(false);
    expect(secondsUntilNext).toBeGreaterThan(0);
  });

  it('calculates secondsUntilNext correctly at mid-window', () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.record();
    vi.advanceTimersByTime(30_000);
    const { secondsUntilNext } = limiter.check();
    expect(secondsUntilNext).toBe(30);
  });

  it('unblocks immediately after the window expires', () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.record();
    vi.advanceTimersByTime(60_001);
    expect(limiter.check()).toEqual({ allowed: true, secondsUntilNext: 0 });
  });

  it('prunes old timestamps so earlier calls do not count', () => {
    const limiter = createRateLimiter(2, 60_000);
    limiter.record();
    vi.advanceTimersByTime(60_001);
    limiter.record();
    // Only the second record is within the window; limit is 2, count is 1
    expect(limiter.check().allowed).toBe(true);
  });

  it('uses default limit of 5 and window of 60 s', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) limiter.record();
    expect(limiter.check().allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(limiter.check().allowed).toBe(true);
  });

  it('secondsUntilNext rounds up to the nearest second', () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.record();
    vi.advanceTimersByTime(59_001); // 999 ms remaining
    const { secondsUntilNext } = limiter.check();
    expect(secondsUntilNext).toBe(1);
  });
});
