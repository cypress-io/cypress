// @ts-check
const { defineConfig } = require('cypress')

// load file devServer that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const { devServer } = require('@cypress/react/plugins/react-scripts')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  component: {
    devServer,
    testFiles: '**/*spec.js',
  },
})
