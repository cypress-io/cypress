import { defineConfig } from 'cypress'
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
    // @ts-ignore TODO: need to add the ability to define framework not
    // in list w/o types failing...
    devServer: {
      bundler: 'webpack',
      webpackConfig,
    },
  },
})
