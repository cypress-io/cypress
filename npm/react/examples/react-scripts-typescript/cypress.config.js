const devServer = require('@cypress/react/plugins/react-scripts')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  devServer(on, config)

  return config
}
const json = {
  "video": false,
  "testFiles": "**/*cy-spec.tsx",
  "viewportWidth": 500,
  "viewportHeight": 800,
  "componentFolder": "src"
}
