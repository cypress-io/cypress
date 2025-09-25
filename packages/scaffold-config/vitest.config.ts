import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/unit/supportFile.spec.ts',
      'test/unit/frameworks.spec.ts',
    ],
    globals: true,
    environment: 'node',
  },
})
