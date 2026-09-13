import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__spec__/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
