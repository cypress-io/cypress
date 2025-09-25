import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/detectors/circleCiDetectorSync.spec.ts',
      'test/detectors/githubActionsDetectorSync.spec.ts',
    ],
    globals: true,
    environment: 'node',
  },
})
