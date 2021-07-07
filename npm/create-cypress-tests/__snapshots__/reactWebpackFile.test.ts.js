exports['webpack-file install template correctly generates plugins config when webpack config path is missing 1'] = `
const injectDevServer = require("@cypress/react/plugins/load-webpack");

const something = require("something");

module.exports = (on, config) => {
  if (config.testingType === "component") {
    injectDevServer(on, config, {
      // TODO replace with valid webpack config path
      webpackFilename: './webpack.config.js'
    });
  }

  return config; // IMPORTANT to return a config
};
`

exports['webpack-file install template correctly generates plugins config when webpack config path is provided 1'] = `
const injectDevServer = require("@cypress/react/plugins/load-webpack");

const something = require("something");

module.exports = (on, config) => {
  if (config.testingType === "component") {
    injectDevServer(on, config, {
      webpackFilename: 'config/webpack.config.js'
    });
  }

  return config; // IMPORTANT to return a config
};
`
