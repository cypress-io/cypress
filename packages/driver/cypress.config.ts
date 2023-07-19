import { defineConfig } from 'cypress'
import { devServer as cypressWebpackDevServer } from '@cypress/webpack-dev-server'

export default defineConfig({
  projectId: 'zx91o1',
  experimentalMemoryManagement: true,
  hosts: {
    'foobar.com': '127.0.0.1',
    '*.foobar.com': '127.0.0.1',
    'barbaz.com': '127.0.0.1',
    '*.barbaz.com': '127.0.0.1',
    '*.idp.com': '127.0.0.1',
    'localalias': '127.0.0.1',
  },
  port: 1234,
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  e2e: {
    experimentalOriginDependencies: true,
    experimentalModifyObstructiveThirdPartyCode: true,
    setupNodeEvents: (on, config) => {
      return require('./cypress/plugins')(on, config)
    },
  },
  component: {
    experimentalSingleTabRunMode: true,
    specPattern: 'cypress/component/**/*.cy.js',
    supportFile: false,
    devServer: (devServerOptions) => {
      return cypressWebpackDevServer({
        ...devServerOptions,
        webpackConfig: {},
      })
    },
  },
})
