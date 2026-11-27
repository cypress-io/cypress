import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['env.spec.ts'],
    environment: 'node',
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    env: {
      CYPRESS_INTERNAL_ENV: 'test',
    },
  },
})
