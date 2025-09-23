import { defineConfig } from 'cypress'
import { plugin as cypressGrepPlugin } from './src/plugin'

export default defineConfig({
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      cypressGrepPlugin(config)

      on('task', {
        grep (config) {
          return cypressGrepPlugin(config)
        },
      })

      return config
    },
  },
  fixturesFolder: false,
})
