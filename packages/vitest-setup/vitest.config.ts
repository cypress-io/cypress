import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/*.spec.ts'],
    environment: 'node',
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
  },
})
