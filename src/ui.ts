import type { DisplayResult, FetchState, GameName } from './types.ts';
import { getGameOptions, GAME_LABELS, summarizeResult } from './lottery.ts';

export class LotteryUI {
  private readonly appEl: HTMLDivElement;
  private readonly selectEl: HTMLSelectElement;
  private readonly buttonEl: HTMLButtonElement;
  private readonly resultsEl: HTMLDivElement;
  private readonly statusEl: HTMLDivElement;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(rootSelector: string) {
    this.appEl = document.querySelector<HTMLDivElement>(rootSelector)!;
    this.appEl.innerHTML = this.buildShell();
    this.selectEl = this.appEl.querySelector<HTMLSelectElement>('#game-select')!;
    this.buttonEl = this.appEl.querySelector<HTMLButtonElement>('#fetch-btn')!;
    this.resultsEl = this.appEl.querySelector<HTMLDivElement>('#results')!;
    this.statusEl = this.appEl.querySelector<HTMLDivElement>('#status')!;
    this.populateSelect();
  }

  onFetch(callback: (game: GameName) => Promise<void>): void {
    this.buttonEl.addEventListener('click', () => {
      void callback(this.selectEl.value as GameName);
    });
  }

  setState(state: FetchState, messageOrSeconds?: string | number): void {
    this.clearCountdown();
    this.statusEl.dataset['state'] = state;
    this.buttonEl.disabled = state === 'loading' || state === 'rate-limited';

    if (state !== 'rate-limited') {
      this.buttonEl.textContent = 'Fetch Results';
    }

    if (state === 'rate-limited' && typeof messageOrSeconds === 'number') {
      this.startCountdown(messageOrSeconds);
    } else if (state === 'error') {
      this.statusEl.textContent =
        typeof messageOrSeconds === 'string' ? messageOrSeconds : 'An error occurred';
    } else {
      this.statusEl.textContent = '';
    }
  }

  renderResult(result: DisplayResult): void {
    const { formattedDate, numbers, bonus, jackpot, nextDrawing, logoUrl } = result;
    const label = GAME_LABELS[result.game];
    this.resultsEl.innerHTML = `
      <div class="result-card" aria-label="${summarizeResult(result)}">
        <div class="result-header">
          <img class="game-logo" src="${logoUrl}" alt="${label}" />
          <span class="result-date">${formattedDate}</span>
        </div>
        ${this.buildNumberBalls(numbers, bonus)}
        ${jackpot != null ? `<span class="multiplier-badge">Estimated Jackpot: ${jackpot}</span>` : ''}
        <p class="next-drawing">Next Drawing: ${nextDrawing}</p>
      </div>`;
  }

  private startCountdown(seconds: number): void {
    let remaining = seconds;
    const update = (): void => {
      this.statusEl.textContent = `Rate limit reached — try again in ${remaining}s`;
      this.buttonEl.textContent = `Wait ${remaining}s`;
      remaining -= 1;
      if (remaining < 0) {
        this.clearCountdown();
        this.setState('idle');
      }
    };
    update();
    this.countdownTimer = setInterval(update, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private buildShell(): string {
    return `
      <header class="app-header">
        <h1>Lottery Number Lookup</h1>
        <p class="subtitle">Select a game and fetch the latest results</p>
      </header>
      <main class="app-main">
        <section class="controls">
          <label for="game-select">Game</label>
          <select id="game-select"></select>
          <button id="fetch-btn" type="button">Fetch Results</button>
        </section>
        <div id="status" data-state="idle"></div>
        <section id="results"></section>
      </main>
      <footer class="app-footer"><p>Data provided by <a href="https://apiverve.com" target="_blank" rel="noopener">APIVerve</a></p></footer>`;
  }

  private populateSelect(): void {
    getGameOptions().forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      this.selectEl.appendChild(opt);
    });
  }

  private buildNumberBalls(numbers: number[], bonus: number | null): string {
    const balls = numbers.map((n) => `<span class="ball">${n}</span>`).join('');
    const bonusBall = bonus != null ? `<span class="ball bonus">${bonus}</span>` : '';
    return `<div class="balls">${balls}${bonusBall}</div>`;
  }
}
