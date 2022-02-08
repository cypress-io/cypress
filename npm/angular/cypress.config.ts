import { defineConfig } from 'cypress'
import { devServer } from '@cypress/webpack-dev-server'

export default defineConfig({
  'experimentalFetchPolyfill': true,
  'fixturesFolder': false,
  'includeShadowDom': true,
  'fileServerFolder': 'src',
  'projectId': 'nf7zag',
  'component': {
    setupNodeEvents (on, config) {
      return require('./cypress/plugins')(on, config)
    },
    devServer (cypressDevServerConfig) {
      const webpackConfig = require('./cypress/plugins/webpack.config')

      return devServer(cypressDevServerConfig, webpackConfig)
    },
  },
})
