import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    name: 'internal-scripts',
    environment: 'node',
    // `*-spec.{js,ts}` files still run on mocha through the root `test-scripts` script
    include: ['unit/**/*.spec.ts'],
    passWithNoTests: true,
  },
})
