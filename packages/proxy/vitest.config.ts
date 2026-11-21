import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    env: {
      CYPRESS_INTERNAL_ENV: 'test',
    },
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
