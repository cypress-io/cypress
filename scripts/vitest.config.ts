import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['@packages/vitest-setup/sanitize-env'],
    name: 'internal-scripts',
    environment: 'node',
    // The complement of `test-scripts:mocha`'s `*[!.]spec.{js,ts}`, so every spec under `unit/` runs on exactly one runner
    include: ['unit/**/*.spec.{js,ts,mts}'],
    // Matches the globals `vitestConfig` declares to ESLint for these specs
    globals: true,
    // Keeps `test-scripts` green while every spec is a mocha `*-spec`
    passWithNoTests: true,
  },
})
