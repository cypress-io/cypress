import { defineConfig } from 'cypress'

export default defineConfig({
  'viewportWidth': 500,
  'viewportHeight': 500,
  'video': false,
  'responseTimeout': 2500,
  'projectId': '134ej7',
  'experimentalFetchPolyfill': true,
  'e2e': {
    'supportFile': false,
  },
  'component': {
    ignoreSpecPattern: 'examples/**/*',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const webpackConfig = require('./webpack.config')

      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {}
      }

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@vue/compiler-core$': '@vue/compiler-core/dist/compiler-core.cjs.js',
      }

      return startDevServer({ options: cypressConfig, webpackConfig })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
