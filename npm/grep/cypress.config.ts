import { defineConfig } from 'cypress'
import { plugin as cypressGrepPlugin } from './src/plugin'
import { compareResults } from './compare-results'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      cypressGrepPlugin(config)

      on('task', {
        grep (config) {
          return cypressGrepPlugin(config)
        },
      })

      on('after:run', compareResults)

      return config
    },
  },
  fixturesFolder: false,
})
