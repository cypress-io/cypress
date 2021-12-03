import { defineConfig } from 'cypress'

export default defineConfig({
  'experimentalFetchPolyfill': true,
  'fixturesFolder': false,
  'includeShadowDom': true,
  'fileServerFolder': 'src',
  'projectId': 'nf7zag',
  'component': {
    'specPattern': 'src/app/**/*cy-spec.ts',
    'setupNodeEvents': require('./cypress/plugins'),
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const webpackConfig = require('./cypress/plugins/webpack.config')

      return startDevServer({
        options: cypressConfig,
        webpackConfig,
      })
    },
  },
})
