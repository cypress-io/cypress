import { defineConfig } from 'cypress'

export default defineConfig({
  'pluginsFile': 'cypress/plugins.js',
  'video': false,
  'fixturesFolder': false,
  'component': {
    'supportFile': 'cypress/support.js',
    devServer (cypressConfig) {
      const path = require('path')
      const { startDevServer } = require('./dist')

      return startDevServer({
        options: cypressConfig,
        viteConfig: {
          configFile: path.resolve(__dirname, 'vite.config.ts'),
        },
      })
    },
  },
})
