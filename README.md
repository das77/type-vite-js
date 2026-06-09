# Lottery Number Lookup

An interactive Vite + TypeScript app that fetches the latest lottery results for four games — Powerball, Mega Millions, EuroMillions, and Lotto Max — using the [APIVerve Lottery API](https://apiverve.com). Built as a learning project for a Full Stack Engineering program.

## Live Demo

**Live site:** [https://das77.github.io/type-vite-js/](https://das77.github.io/type-vite-js/)

## Features

- Live lottery results for four games via `https://api.apiverve.com/v1/lottery`
- Client-side rate limiting (5 lookups per minute) with a live countdown timer
- Per-game SVG logos and styled number balls with a distinct bonus ball
- Estimated jackpot and next drawing date calculated from the draw date
- CSS state machine (`data-state` attribute) driving loading spinner, error, and rate-limited UI states
- Deploys to GitHub Pages via GitHub Actions using a repository secret for the API key

## Getting Started

```bash
npm install
```

Create a `.env` file at the project root (see `.env.example`):

```env
VITE_API_KEY=your_apiverve_key_here
```

```bash
npm run dev      # development server at http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

## Project Structure

```text
src/
├── types.ts        # All shared TypeScript interfaces and type aliases
├── api.ts          # API client factory (closure over apiKey + baseUrl)
├── ratelimiter.ts  # Rate limiter factory (closure over timestamp log)
├── lottery.ts      # Game metadata, SVG logo imports, data processing
├── ui.ts           # LotteryUI class — all DOM interaction
├── main.ts         # Entry point — wires client, limiter, and UI together
└── style.css       # Full styling including CSS-only loading spinner
```

## Unit Testing

Tests are written with [Vitest](https://vitest.dev/) — the natural choice for a Vite project because it shares the same config file, handles `import.meta.env` without shims, and has a Jest-compatible API.

```bash
npm test              # run all tests once
npm run test:watch    # re-run on file save
npm run coverage      # run tests and generate coverage report
npm run typecheck     # type-check without building
```

**72 tests across 4 files, 100% coverage:**

| File | Tests | Scope |
| --- | --- | --- |
| `src/ratelimiter.test.ts` | 9 | Allow/block logic, timestamp pruning, `secondsUntilNext` math, ceiling rounding, default parameters |
| `src/api.test.ts` | 9 | Happy path, all four error branches (body message, missing message, JSON parse failure, 401), custom base URL |
| `src/lottery.test.ts` | 27 | Number splitting with/without megaBall, date formatting, UTC no-shift invariant, all four logo mappings, every draw-day transition for all four games, `summarizeResult` variants |
| `src/ui.test.ts` | 27 | Shell rendering, select population, all five `FetchState` transitions, countdown start/decrement/expire/cancel, all `renderResult` variants, `onFetch` wiring |

`src/types.ts` and `src/main.ts` are excluded from coverage — pure type definitions have no executable paths, and the entry point is covered by integration.

**Viewing the HTML coverage report:**

After running `npm run coverage`, the report is written to `public/coverage/`:

- **Dev server:** `http://localhost:5173/coverage/`
- **Deployed site:** `https://das77.github.io/type-vite-js/coverage/` (if coverage was generated before the build)

`public/coverage/` is gitignored so the generated files are never committed.

## Deployment

The GitHub Actions workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and deploys to GitHub Pages on every push to `main`.

**One-time setup:**

1. Go to **Settings → Secrets and variables → Actions** and add `VITE_API_KEY` as a repository secret
2. Go to **Settings → Pages** and set the source to **GitHub Actions**

The `vite.config.ts` reads `GITHUB_REPOSITORY` (injected automatically by Actions) to set the correct `base` path for the Pages subpath. Locally it falls back to `/` so `npm run dev` is unaffected.

---

## Reflection

### How TypeScript's type system helped catch errors and improve code quality

Defining all shared shapes in `src/types.ts` upfront meant the compiler immediately flagged mismatches between what the API actually returned and what the rest of the code expected. The real API response uses `lotteryType` and `drawDate` as field names — not `game` and `date` as originally assumed. Without the `LotteryResult` interface, that mismatch would have silently produced `undefined` values at runtime. TypeScript surfaced it at compile time.

The generic `ApiResponse<T>` interface let the fetch function be typed precisely — `Promise<ApiResponse<LotteryResult>>` — without resorting to `any`. The union type `GameName = 'powerball' | 'megamillions' | 'euromillions' | 'lottomax'` acts as a compile-time allowlist: passing an arbitrary string where a `GameName` is expected is a type error. Similarly, `FetchState` as a union type made the `data-state` CSS attribute selector approach safe — every state the UI can enter is enumerated in one place.

The strict compiler flags (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`) also enforced discipline that wouldn't come naturally from habit alone — for example, `verbatimModuleSyntax: true` requires `import type { ... }` for every type-only import, which makes the module graph explicit and ensures the TypeScript compiler never emits unnecessary runtime imports.

### Project structure decisions and module organization

Each file has a single, clear responsibility and a dependency direction that flows inward — `main.ts` depends on everything, but `types.ts` depends on nothing:

```text
types.ts → api.ts ──────────────────┐
         → ratelimiter.ts           │
         → lottery.ts (+ assets)    │
                                    ↓
                                  ui.ts → main.ts
```

`types.ts` is intentionally pure types with no runtime code — it's the shared vocabulary. `api.ts` and `ratelimiter.ts` are factory modules that export constructor functions rather than singleton instances, which makes them independently testable and keeps side effects out of module scope. `lottery.ts` is pure data processing with no DOM or fetch dependencies, so it can be reasoned about in isolation. `ui.ts` owns all DOM interaction as a class and takes a root selector, keeping it decoupled from the specific HTML structure in `index.html`. `main.ts` is the composition root — it's the only place that knows about all the other modules.

The `tsconfig.json` constraint `"include": ["./src/*"]` (single glob, no subdirectories) reinforces this flat layout and keeps import paths simple.

### How Vite's dev server and build pipeline supported the development workflow

The instant hot module replacement (HMR) made iteration fast — editing `style.css` or `ui.ts` reflected in the browser without a full reload or manual refresh. Vite's native ES module handling in development means there's no bundling step during dev, so startup is near-instant even as the project grows.

Two Vite-specific features were particularly useful here. First, SVG files imported as ES modules are resolved to their hashed asset URLs automatically — `import powerbballLogo from './assets/Powerball_logo.svg'` just works in both dev and production, and `vite/client` provides the TypeScript type so the import isn't flagged as an error. Second, `import.meta.env.VITE_API_KEY` is replaced at build time with the actual environment variable value, keeping the key out of source control while making it trivially available to the bundled app.

The `build.target: 'es2023'` setting in `vite.config.ts` means the output isn't transpiled down to older syntax — modern features like optional chaining and nullish coalescing are emitted as-is, resulting in a smaller and more readable bundle.

### JavaScript patterns that were most useful and why

**Closures** were the most structurally significant pattern. Both `createLotteryClient` and `createRateLimiter` are factory functions that return objects whose methods share access to private enclosed state — `apiKey` and `baseUrl` in the client, and the `timestamps[]` array in the rate limiter. The caller never touches those internals directly. This gave the same encapsulation benefit as a class without the ceremony, and made it easy to reason about what each factory "owns."

**Destructuring** reduced repetitive property access throughout. In `processResult`, the entire `LotteryResult` is destructured in the parameter list — `{ lotteryType, drawDate, numbers, megaBall, jackpot }` — so the function body reads like a list of named values rather than a chain of property accesses. Array destructuring with rest (`const [first, ...rest] = mainNumbers`) was used to split the main number balls before reassembling them with spread, which made the intent clear even though `[first, ...rest]` is equivalent to a copy.

**Optional chaining and nullish coalescing** handled the API's nullable fields cleanly. `body?.message ?? \`HTTP ${res.status}\`` in the error handler reads as a single expression: "use the message if it exists, otherwise fall back to the status code." Without these operators the same logic would be a nested ternary or an if/else block.

**`Object.entries`** in `lottery.ts` turned the `GAME_LABELS` record into the `[value, label]` pairs that `populateSelect` iterates over to build the `<select>` element. It kept the game metadata defined in one place (the `Record<GameName, string>`) while making it trivially consumable as a list.

**`async/await` with `try/catch`** in `handleFetch` kept the asynchronous fetch flow readable as sequential steps. The `try` block reads top-to-bottom: check rate limit → set loading state → record the attempt → fetch → render. The `catch` block handles any failure from any of those steps in one place, which is simpler than chaining `.then` and `.catch` handlers.
