import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      CYPRESS_INTERNAL_ENV: 'test',
    },
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
