module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'component': {
    setupNodeEvents (on, config) {
      // let's bundle spec files and the components they include using
      // the same bundling settings as the project by loading .babelrc
      // https://github.com/bahmutov/cypress-react-unit-test#install
      const devServer = require('@cypress/react/plugins/babel')

      devServer(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
}
