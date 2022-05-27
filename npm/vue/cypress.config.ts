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
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
