import { defineConfig } from 'cypress'

export default defineConfig({
  'pluginsFile': 'cypress/plugins.js',
  'video': false,
  'fixturesFolder': false,
  'testFiles': '**/*.spec.*',
  'componentFolder': 'cypress/components',
  'component': {
    setupNodeEvents (on, config) {
      const path = require('path')
      const { startDevServer } = require('./dist')

      on('dev-server:start', async (options) => {
        return startDevServer({
          options,
          viteConfig: {
            configFile: path.resolve(__dirname, '..', 'vite.config.ts'),
          },
        })
      })

      return config
    },
  },
})
