import { defineConfig } from 'cypress'

export default defineConfig({
  'fixturesFolder': false,
  'e2e': {
    'supportFile': false,
    async setupNodeEvents (on, config) {
      const webpackPreprocessor = await import('../..')

      const webpack = await import('./webpack.config')

      on('file:preprocessor', webpackPreprocessor({ webpack }))

      return config
    },
  },
})
