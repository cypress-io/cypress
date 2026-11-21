import { defineConfig } from 'vitest/config'
import unitConfig from './vitest.config'

export default defineConfig({
  test: {
    ...unitConfig.test,
    include: ['test/integration/**/*.spec.{js,ts}'],
    setupFiles: ['test/support/vitest-integration-setup.ts'],
    reporters: [
      'default',
      ['junit', { suiteName: 'Server integration tests (vitest)', outputFile: '/tmp/cypress/junit/server-integration-test-results.xml' }],
    ],
  },
})
