import { defineConfig } from 'vitest/config'

/**
 * Unit tests migrated from Mocha use `*.spec.{js,ts}` under `test/unit/`.
 * Legacy Mocha unit tests remain `*_spec.{js,ts}` until migrated.
 * setupFiles (spec_helper port) is added in a follow-up change.
 */
export default defineConfig({
  test: {
    name: '@packages/server',
    environment: 'node',
    globals: true,
    include: ['test/unit/**/*.spec.{js,ts}'],
    exclude: ['**/node_modules/**', '**/*_spec.{js,ts}'],
    testTimeout: 10_000,
    env: {
      NODE_ENV: 'test',
      CYPRESS_INTERNAL_ENV: 'test',
    },
    poolOptions: {
      forks: {
        // Match packages/server/test/scripts/run.js (Mocha) for HTTP header limit in tests
        execArgv: ['--max-http-header-size=1048576'],
      },
    },
    reporters: [
      'default',
      [
        'junit',
        {
          suiteName: 'Server unit tests (Vitest)',
          outputFile: '/tmp/cypress/junit/server-unit-test-results.xml',
        },
      ],
    ],
    // setupFiles: ['test/vitest-setup.ts'],
  },
})
