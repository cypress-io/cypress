const { defineConfig } = require('cypress')

// @ts-check

// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/babel')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  testFiles: '**/*spec.js',
  viewportWidth: 500,
  viewportHeight: 500,
  componentFolder: 'src',
  component: {
    setupNodeEvents (on, config) {
      devServer(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
