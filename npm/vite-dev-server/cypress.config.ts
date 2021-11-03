import { defineConfig } from 'cypress'

export default defineConfig({
  'pluginsFile': 'cypress/plugins.js',
  'video': false,
  'fixturesFolder': false,
  'testFiles': '**/*.spec.*',
  'componentFolder': 'cypress/components',
})
