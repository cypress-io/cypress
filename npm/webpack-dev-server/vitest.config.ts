import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    // many of these tests are e2e in nature and change the working directory of the process, which impacts tests running in the same process.
    // Because of this, we disable file parallelism to avoid collisions and flaky tests
    fileParallelism: false,
    globals: true,
    environment: 'node',
  },
})
