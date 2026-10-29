// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

// Isolation spike: launches Chrome with site isolation on, so a cross-origin
// AUT runs in its own renderer process (an out-of-process iframe).
export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: 'cypress/e2e/cy/remote_driver*.cy.ts',
    setupNodeEvents (on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args = launchOptions.args.filter((arg) => arg !== '--disable-site-isolation-trials')
          launchOptions.args.push('--site-per-process')
        }

        return launchOptions
      })

      return baseConfig.e2e!.setupNodeEvents!(on, config)
    },
  },
  component: undefined,
})
