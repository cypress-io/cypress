import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/project/index.spec.ts', 'test/project/utils.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
