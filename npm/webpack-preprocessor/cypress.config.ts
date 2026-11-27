import { defineConfig } from 'cypress'
import webpackPreprocessor from './index'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/tests/**/*',
    supportFile: false,
    setupNodeEvents (on, config) {
      on('file:preprocessor', webpackPreprocessor())

      return config
    },
  },
})
