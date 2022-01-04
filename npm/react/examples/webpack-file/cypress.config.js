module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'component': {
    'specPattern': 'src/**/*.cy.js',
    setupNodeEvents (on, config) {
      require('@cypress/react/plugins/load-webpack')(on, config, {
        // from the root of the project (folder with cypress.config.{ts|js} file)
        webpackFilename: 'webpack.config.js',
      })

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
}
