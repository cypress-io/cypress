// @ts-check
const { defineConfig } = require('cypress')

// load the devServer function that comes with this plugin
// https://github.com/cypress-io/cypress/tree/master/npm/react#install
const { devServer } = require('@cypress/react/plugins/react-scripts')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  component: {
    devServer,
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
  },
})
