import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/detectors/circleCiDetectorSync.spec.ts',
    ],
    globals: true,
    environment: 'node',
  },
})
