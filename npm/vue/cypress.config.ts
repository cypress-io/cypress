import { defineConfig } from 'cypress'
import { devServer } from '@cypress/webpack-dev-server'

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
    excludeSpecPattern: 'examples/**/*',
    devServer (cypressDevServerConfig) {
      const webpackConfig = require('./webpack.config')

      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {}
      }

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@vue/compiler-core$': '@vue/compiler-core/dist/compiler-core.cjs.js',
      }

      return devServer(cypressDevServerConfig, { webpackConfig })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
