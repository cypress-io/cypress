// @ts-check

// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/babel')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  devServer(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
