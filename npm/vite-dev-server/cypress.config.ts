import { defineConfig } from 'cypress'
import { devServer } from './dist'

export default defineConfig({
  'pluginsFile': 'cypress/plugins.js',
  'video': false,
  'fixturesFolder': false,
  'component': {
    'supportFile': 'cypress/support.js',
    devServer (cypressDevServerConfig) {
      const path = require('path')

      return devServer(cypressDevServerConfig, {
        configFile: path.resolve(__dirname, 'vite.config.ts'),
      })
    },
  },
})
