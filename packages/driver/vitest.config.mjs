import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/unit/**/*.spec.ts'],
    environment: 'jsdom',
    exclude: ['**/__fixtures__/**/*'],
  },
})
