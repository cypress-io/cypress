import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      '{packages,tools,scripts}/*/vi{test,te}.config.{ts,mjs}',
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
