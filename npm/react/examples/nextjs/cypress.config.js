const devServer = require('@cypress/react/plugins/next')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  devServer(on, config)

  return config
}
const json = {
  "video": false,
  "testFiles": "**/*.spec.{js,jsx}",
  "viewportWidth": 500,
  "viewportHeight": 800,
  "experimentalFetchPolyfill": true,
  "componentFolder": "cypress/components",
  "env": {
    "coverage": true
  }
}