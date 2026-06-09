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
})
