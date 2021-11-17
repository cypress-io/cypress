import { defineConfig } from 'cypress'

export default defineConfig({
  'viewportWidth': 500,
  'viewportHeight': 500,
  'video': false,
  'responseTimeout': 2500,
  'projectId': '134ej7',
  'testFiles': '**/*spec.{js,ts,tsx}',
  'experimentalFetchPolyfill': true,
  'component': {
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const webpackConfig = require('./webpack.config')

      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {}
      }

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@vue/compiler-core$': '@vue/compiler-core/dist/compiler-core.cjs.js',
      }

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
