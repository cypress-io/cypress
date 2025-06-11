import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/unit/**/*.vspec.ts'],
    exclude: ['**/__snapshots__/**/*', '**/dist/**/*', '**/node_modules/**/*'],
    reporters: [
      'default',
      ['junit', { suiteName: 'v8-snapshot tooling Unit Tests', outputFile: '/tmp/cypress/junit/driver-test-results.xml' }],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['lcovonly'],
      exclude: ['**/__snapshots__/**/*', '**/dist/**/*', '**/node_modules/**/*', 'test/**/*', 'vite.config.mjs', 'cache/**/*'],
    },
  },
})
