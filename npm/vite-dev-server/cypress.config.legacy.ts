import { defineConfig } from 'cypress'
import { startDevServer } from './dist'

export default defineConfig({
  'video': false,
  'fixturesFolder': false,
  'component': {
    'supportFile': './cypress/support.js',
    specPattern: '**/smoke.cy.ts',
    // startDevServer is the legacy distribution that was renamed
    // to devServer to align with Cypress 10.0 configuration pitons.
    // This configuration verifying backwards compatibility.
    devServer (options) {
      return startDevServer({ options })
    },
  },
})
