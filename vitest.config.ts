import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only include the specific test files we want to run
    projects: [
      // Packages that have their own vitest config files
      'packages/*',
      'npm/*',
      'tooling/*',
    ],
    // Global reporters that will be used across all projects
    reporters: [
      'default',
      ['junit', {
        suiteName: 'Cypress Tests',
        outputFile: '/tmp/cypress/junit/test-results.xml',
      }],
    ],
    // Global coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/__fixtures__/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
})
