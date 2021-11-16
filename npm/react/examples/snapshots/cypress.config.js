// @ts-check
const { defineConfig } = require('cypress')

// load the devServer function that comes with this plugin
// https://github.com/cypress-io/cypress/tree/master/npm/react#install
const { devServer } = require('@cypress/react/plugins/react-scripts')

const {
  initPlugin: initSnapshots,
} = require('cypress-plugin-snapshots/plugin')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  ignoreTestFiles: ['**/__snapshots__/*', '**/__image_snapshots__/*'],
  env: {
    'cypress-plugin-snapshots': {
      prettier: true,
    },
  },
  component: {
    devServer,
    specPattern: '**/*-spec.js',
    setupNodeEvents (on, config) {
      // initialize the snapshots plugin following
      // https://github.com/meinaart/cypress-plugin-snapshots
      initSnapshots(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
