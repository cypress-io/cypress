import { defineConfig } from 'cypress'
import { devServer } from '@cypress/webpack-dev-server'
import * as webpackConfig from './cypress/plugins/webpack.config'

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
    devServer,
    devServerConfig: { webpackConfig },
  },
})
