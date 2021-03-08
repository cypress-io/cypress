// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
// https://github.com/bahmutov/cypress-react-unit-test#install
const injectWebpackWithBabelDevServer = require('@cypress/react/plugins/babel')

module.exports = (on, config) => {
  injectWebpackWithBabelDevServer(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
