import head from 'lodash/head'
import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      // make sure plugin can access dependencies
      head([1, 2, 3])

      return config
    },
  },
})
