import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@packages/server',
    environment: 'node',
    globals: true,
    include: ['test/unit/**/*.spec.{js,ts}'],
    testTimeout: 10_000,
    // Server specs share the data-context singleton, nock's global
    // interception, the on-disk cache, process.env, and real port binds, so
    // they must run sequentially like they did under mocha.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      CYPRESS_INTERNAL_ENV: 'test',
    },
    poolOptions: {
      forks: {
        // Match the mocha runner's header limit (test/scripts/run.js)
        execArgv: ['--max-http-header-size=1048576'],
      },
    },
    reporters: [
      'default',
      ['junit', { suiteName: 'Server unit tests (vitest)', outputFile: '/tmp/cypress/junit/server-unit-test-results.xml' }],
    ],
  },
})
