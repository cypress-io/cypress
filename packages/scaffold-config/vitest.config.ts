import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/unit/supportFile.spec.ts'],
    globals: true,
    environment: 'node',
  },
})
