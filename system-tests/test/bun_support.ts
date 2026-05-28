import { execSync } from 'child_process'
import path from 'path'
import express from 'express'

/**
 * Serves `system-tests/projects/<dir>` on port 5000 so `baseUrl: 'http://localhost:5000'` and
 * `cy.visit('/cypress/fixtures/...')` resolve during system tests (see `systemTests.setup` servers).
 */
export function bunFixtureHttpServer (projectDir: 'bun-with-deps' | 'bun-workspace') {
  const root = path.join(__dirname, '../projects', projectDir)

  return {
    port: 5000,
    onServer (app: express.Application) {
      app.use(express.static(root))
    },
  }
}

export function hasBunInstalled () {
  try {
    execSync('bun --version', { stdio: 'ignore' })

    return true
  } catch {
    return false
  }
}

/**
 * When running in CI, Bun-backed system tests must execute (not be skipped) so regressions
 * are not hidden. CircleCI installs Bun in `run-system-tests` before Mocha runs.
 */
export function shouldSkipBunSystemTests (): boolean {
  const bunInstalled = hasBunInstalled()

  if (process.env.CI && !bunInstalled) {
    throw new Error(
      'Bun system tests are running in CI but `bun` was not found on PATH. Install Bun before the "Run system tests" step (see `.circleci/src/pipeline/@pipeline.yml` command `run-system-tests`).',
    )
  }

  return !bunInstalled
}
