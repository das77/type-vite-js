/// <reference types="vitest" />
import { defineConfig } from 'vite'

// In GitHub Actions, GITHUB_REPOSITORY is "owner/repo-name".
// Extract the repo name so GitHub Pages serves assets from the right subpath.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repo ? `/${repo}/` : '/';

export default defineConfig({
  base,
  build: {
    target: 'es2023',
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'public/coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/types.ts', 'src/**/*.test.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
})
