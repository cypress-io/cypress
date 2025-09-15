import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      '{packages,tooling,scripts}/*/vitest.config.{ts,mjs}',
      'cli/vitest.config.*',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', 'system-tests/**'],
    coverage: {
      provider: 'v8',
      reporter: ['clover'],
    },
    reporters: ['default', 'junit'],
  },
})
