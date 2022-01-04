module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'ignoreSpecPattern': [
    '**/__snapshots__/*',
    '**/__image_snapshots__/*',
  ],
  'env': {
    'cypress-plugin-snapshots': {
      'prettier': true,
    },
  },
  'component': {
    'specPattern': 'cypress/component/**/*-spec.js',
    setupNodeEvents (on, config) {
      // load file devServer that comes with this plugin
      // https://github.com/bahmutov/cypress-react-unit-test#install
      const devServer = require('@cypress/react/plugins/react-scripts')
      const { initPlugin: initSnapshots } = require('cypress-plugin-snapshots/plugin')

      devServer(on, config)
      // initialize the snapshots plugin following
      // https://github.com/meinaart/cypress-plugin-snapshots
      initSnapshots(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
}
