import { defineConfig } from 'cypress'
import { devServer } from './dist'

export default defineConfig({
  'video': false,
  'fixturesFolder': false,
  'component': {
    devServer,
  },
})
