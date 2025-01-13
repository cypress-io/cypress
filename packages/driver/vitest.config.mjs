import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/unit/**/*.spec.ts'],
    environment: 'jsdom',
    exclude: ['**/__fixtures__/**/*'],
    reporters: [
      'default',
      ['junit', { suiteName: 'Driver Unit Tests', outputFile: '/tmp/cypress/junit/driver-test-results.xml' }],
    ],
  },
})
