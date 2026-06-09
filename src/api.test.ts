import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLotteryClient } from './api.ts';

const okResponse = (body: unknown) => ({
  ok: true,
  json: () => Promise.resolve(body),
});

const errResponse = (status: number, body: unknown) => ({
  ok: false,
  status,
  json: () => Promise.resolve(body),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createLotteryClient', () => {
  describe('fetchLottery — happy path', () => {
    it('calls the correct URL with the game query param', async () => {
      const mockFetch = vi.fn().mockResolvedValue(okResponse({ status: 'ok', code: 200, data: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const client = createLotteryClient('test-key');
      await client.fetchLottery('powerball');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.apiverve.com/v1/lottery?numbers=powerball',
        expect.anything(),
      );
    });

    it('sends both Content-Type and x-api-key headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue(okResponse({ status: 'ok', code: 200, data: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const client = createLotteryClient('my-key');
      await client.fetchLottery('megamillions');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'my-key',
          },
        }),
      );
    });

    it('returns the parsed API response', async () => {
      const payload = { status: 'ok', code: 200, data: { lotteryType: 'powerball' } };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(payload)));

      const client = createLotteryClient('key');
      const result = await client.fetchLottery('powerball');

      expect(result).toEqual(payload);
    });

    it('uses a custom baseUrl when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue(okResponse({ status: 'ok', code: 200, data: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const client = createLotteryClient('key', 'https://example.com/api');
      await client.fetchLottery('lottomax');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/lottery?numbers=lottomax',
        expect.anything(),
      );
    });

    it('works for all four game names', async () => {
      const mockFetch = vi.fn().mockResolvedValue(okResponse({ status: 'ok', code: 200, data: {} }));
      vi.stubGlobal('fetch', mockFetch);
      const client = createLotteryClient('key');

      for (const game of ['powerball', 'megamillions', 'euromillions', 'lottomax'] as const) {
        await client.fetchLottery(game);
      }

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('fetchLottery — error path', () => {
    it('throws with the body message on a non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errResponse(429, { message: 'Too Many Requests' })));

      const client = createLotteryClient('key');
      await expect(client.fetchLottery('powerball')).rejects.toThrow('Too Many Requests');
    });

    it('falls back to HTTP status when body has no message field', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errResponse(500, {})));

      const client = createLotteryClient('key');
      await expect(client.fetchLottery('powerball')).rejects.toThrow('HTTP 500');
    });

    it('falls back to HTTP status when body JSON parse fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('invalid json')),
      }));

      const client = createLotteryClient('key');
      await expect(client.fetchLottery('powerball')).rejects.toThrow('HTTP 503');
    });

    it('throws with HTTP 401 when API key is rejected', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errResponse(401, { message: 'Unauthorized' })));

      const client = createLotteryClient('bad-key');
      await expect(client.fetchLottery('megamillions')).rejects.toThrow('Unauthorized');
    });
  });
});
