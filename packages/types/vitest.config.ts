import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    include: ['test/**/*.spec.ts'],
    environment: 'node',
  },
})
