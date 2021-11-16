import { defineConfig } from 'cypress'

export default defineConfig({
  'experimentalFetchPolyfill': true,
  'fixturesFolder': false,
  'includeShadowDom': true,
  'fileServerFolder': 'src',
  'projectId': 'nf7zag',
  'component': {
    'componentFolder': 'src/app',
    'testFiles': '**/*cy-spec.ts',
    'setupNodeEvents': require('./cypress/plugins'),
  },
})
