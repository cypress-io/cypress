// load Webpack file preprocessor that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const preprocessor = require('cypress-react-unit-test/plugins/load-webpack')
module.exports = (on, config) => {
  // point at the webpack config file at the root of the project
  config.env.webpackFilename = 'webpack.config.js'
  preprocessor(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
