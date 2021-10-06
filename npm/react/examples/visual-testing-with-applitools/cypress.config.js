// @ts-check

// load file devServer that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/react-scripts')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  devServer(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}

// @ts-ignore
require('@applitools/eyes-cypress')(module)
const json = {
  "video": false,
  "fixturesFolder": false,
  "testFiles": "**/*spec.js",
  "viewportWidth": 1000,
  "viewportHeight": 1000,
  "componentFolder": "src",
  "env": {
    "coverage": false
  }
}
