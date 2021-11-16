// @ts-check
const { defineConfig } = require("cypress");

// load the devServer function that comes with this plugin
// https://github.com/cypress-io/cypress/tree/master/npm/react#install
const { devServer } = require('@cypress/react/plugins/react-scripts');

const {
  addMatchImageSnapshotPlugin
} = require("cypress-image-snapshot/plugin");

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 1000,
  viewportHeight: 1000,
  component: {
    devServer,
    componentFolder: "src",
    specPattern: "**/*cy-spec.js",
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config;
    }
  }
});
