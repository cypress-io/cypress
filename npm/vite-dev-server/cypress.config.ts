import { defineConfig } from 'cypress'
import { devServer } from './dist'

export default defineConfig({
  'video': false,
  'fixturesFolder': false,
  'component': {
    'supportFile': './cypress/support.js',
    devServer,
  },
})
