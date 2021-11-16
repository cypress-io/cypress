module.exports = {
  "video": false,
  "fixturesFolder": false,
  "testFiles": "**/*cy-spec.js",
  "viewportWidth": 1000,
  "viewportHeight": 1000,
  "componentFolder": "src",
  'component': {
    setupNodeEvents(on, config) {
      // load file devServer that comes with this plugin
      // https://github.com/bahmutov/cypress-react-unit-test#install
      const devServer = require('@cypress/react/plugins/react-scripts')
      const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin')

      addMatchImageSnapshotPlugin(on, config)
      devServer(on, config)
      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    }
  }
}
