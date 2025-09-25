import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/unit/supportFile.spec.ts',
      'test/unit/frameworks.spec.ts',
      'test/unit/detect.spec.ts',
      'test/unit/ct-detect-third-party.spec.ts',
    ],
    globals: true,
    environment: 'node',
  },
})
