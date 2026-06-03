import { defineConfig } from 'cypress'
import { plugin as cypressGrepPlugin } from '../src/plugin'
import { compareResults } from '../compare-results'

// Regression coverage for https://github.com/cypress-io/cypress/issues/26642.
//
// This config file deliberately lives in a subdirectory (`cypress/`) rather than
// at the project root. The `specPattern` below is anchored to the project root
// (note the leading `cypress/` segment), so spec pre-filtering only works when
// the plugin globs relative to the project root. If it ever regresses to using
// the config file's directory (e.g. `process.cwd()`), the glob resolves zero
// specs, pre-filtering silently no-ops, and every tag spec runs instead of just
// the `regression`-tagged one — failing the snapshot comparison.
export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    defaultCommandTimeout: 1000,
    specPattern: 'cypress/e2e/tags/*.cy.ts',
    setupNodeEvents (on, config) {
      cypressGrepPlugin(config)

      on('after:run', compareResults)

      return config
    },
  },
  fixturesFolder: false,
})
