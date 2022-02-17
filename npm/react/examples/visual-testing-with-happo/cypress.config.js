// @ts-check
const { defineConfig } = require('cypress')

// load the devServer function that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const { devServer } = require('@cypress/react/plugins/react-scripts')

// @ts-ignore
const happoTask = require('happo-cypress/task')

module.exports = defineConfig({
  video: false,
  viewportWidth: 400,
  viewportHeight: 700,
  component: {
    devServer,
    componentFolder: 'src',
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents (on, config) {
      on('task', happoTask)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
