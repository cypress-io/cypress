// load Webpack file preprocessor that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/load-webpack')

module.exports = (on, config) => {
  devServer(on, config, {
    webpackFilename: 'webpack.config.js',
  })

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
