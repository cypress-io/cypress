import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'ypt4pf',
  experimentalStudio: true,
  experimentalMemoryManagement: true,
  experimentalWebKitSupport: true,
  hosts: {
    'foobar.com': '127.0.0.1',
    '*.foobar.com': '127.0.0.1',
    'barbaz.com': '127.0.0.1',
    '*.barbaz.com': '127.0.0.1',
    '*.idp.com': '127.0.0.1',
    'localalias': '127.0.0.1',
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  e2e: {
    specPattern: '{cypress/**/with-inject-document-domain/**/origin/**/*.cy.{js,ts},cypress/**/privileged_commands.cy.ts}',
    injectDocumentDomain: true,
    experimentalOriginDependencies: true,
    experimentalModifyObstructiveThirdPartyCode: true,
    setupNodeEvents: (on, config) => {
      on('task', {
        log (message) {
          // eslint-disable-next-line no-console
          console.log(message)

          return null
        },
      })

      return require('./cypress/plugins')(on, config)
    },
    baseUrl: 'http://localhost:3500',
  },
})
