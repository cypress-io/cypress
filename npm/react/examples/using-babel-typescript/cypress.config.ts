import { defineConfig } from 'cypress'

// @ts-check

// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/babel')

export default defineConfig({
  video: false,
  fixturesFolder: false,
  testFiles: '**/*spec.tsx',
  viewportWidth: 500,
  viewportHeight: 500,
  componentFolder: 'src',
  e2e: {
    setupNodeEvents (on, config) {
      devServer(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
