import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    include: ['src/**/*.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
