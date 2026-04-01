import { defineConfig } from 'vitest/config'

/**
 * Unit tests migrated from Mocha use `*.spec.{js,ts}` under `test/unit/`.
 * Legacy Mocha unit tests remain `*_spec.{js,ts}` until migrated.
 * In migrated files, use Vitest (`expect`, `vi`) — not sinon/chai.
 * Shared setup for specs that use spec_helper is added in test/vitest-setup.ts when migrated.
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
