import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    // Specs and the CommonJS scripts they load require TypeScript modules through Node, which vite doesn't transform
    setupFiles: ['@packages/ts/register'],
    include: ['unit/**/*.spec.ts'],
    environment: 'node',
  },
})
