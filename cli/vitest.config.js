import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/lib/util.spec.ts',
      'test/lib/logger.spec.ts',
      'test/lib/errors.spec.ts',
    ],
  },
})
