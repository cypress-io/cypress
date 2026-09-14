import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__spec__/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      all: true,
      reporter: ['clover'],
    },
  },
})
