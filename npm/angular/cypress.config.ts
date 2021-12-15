import { defineConfig } from 'cypress'

export default defineConfig({
  'experimentalFetchPolyfill': true,
  'fixturesFolder': false,
  'includeShadowDom': true,
  'fileServerFolder': 'src',
  'projectId': 'nf7zag',
  'component': {
    'componentFolder': 'src/app',
    'testFiles': '**/*cy-spec.ts',
    'setupNodeEvents': require('./cypress/plugins'),
    'supportFile': 'cypress/support/component.ts',
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
