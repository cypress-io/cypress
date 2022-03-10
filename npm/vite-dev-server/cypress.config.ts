import { defineConfig } from 'cypress'
import { devServer } from './dist'

export default defineConfig({
  'video': false,
  'fixturesFolder': false,
  'component': {
    'supportFile': './cypress/support.js',
    setupNodeEvents (_on, config) {
      if (config.env.RUN_SIGNATURE) {
        require('./cypress/new-signature/plugins.js')
      }

      return config
    },
    devServer (cypressDevServerConfig) {
      const path = require('path')

      return devServer(cypressDevServerConfig, {
        configFile: path.resolve(__dirname, 'vite.config.ts'),
      })
    },
  },
})
