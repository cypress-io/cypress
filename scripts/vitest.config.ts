import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    name: 'internal-scripts',
    environment: 'node',
    // `test-scripts:mocha` takes every other `*spec.{js,ts}` under `unit/`
    include: ['unit/**/*.spec.{js,ts}'],
    // Matches the globals `vitestConfig` declares to ESLint for these specs
    globals: true,
    // Lets `test-scripts:vitest` pass when `unit/` holds no `*.spec` files
    passWithNoTests: true,
  },
})
