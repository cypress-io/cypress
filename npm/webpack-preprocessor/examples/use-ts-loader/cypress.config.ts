import { defineConfig } from 'cypress'

export default defineConfig({
  'fixturesFolder': false,
  'supportFile': false,
  'e2e': {
    async setupNodeEvents (on, config) {
      const webpackPreprocessor = await import('../..')

      const webpack = await import('./webpack.config')

      on('file:preprocessor', webpackPreprocessor({ webpack }))

      return config
    },
  },
})
