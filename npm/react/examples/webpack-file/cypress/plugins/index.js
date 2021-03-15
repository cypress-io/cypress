module.exports = (on, config) => {
  require('@cypress/react/plugins/load-webpack')(on, config, {
    // from the root of the project (folder with cypress.json file)
    webpackFilename: 'webpack.config.js',
  })

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
