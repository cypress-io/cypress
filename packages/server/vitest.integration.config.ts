import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The virtual display has to start after the environment is sanitized,
    // which would otherwise strip the DISPLAY it sets
    globalSetup: ['@packages/vitest-setup/sanitize-env', './test/integration/support/xvfb.ts'],
    name: '@packages/server integration',
    environment: 'node',
    include: ['test/integration/**/*.spec.ts'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    // Integration specs bind real ports and drive real browsers and child
    // processes, so running files in parallel makes them contend for both
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      CYPRESS_INTERNAL_ENV: 'test',
    },
    poolOptions: {
      forks: {
        // The proxy forwards headers up to 1MB (https://github.com/cypress-io/cypress/issues/76)
        execArgv: ['--max-http-header-size=1048576'],
      },
    },
    reporters: [
      'default',
      ['junit', { suiteName: 'Server integration tests (vitest)', outputFile: '/tmp/cypress/junit/server-integration-test-results.xml' }],
    ],
  },
})
