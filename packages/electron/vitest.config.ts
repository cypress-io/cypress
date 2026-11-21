import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      all: true,
      reporter: ['clover'],
    },
  },
})
