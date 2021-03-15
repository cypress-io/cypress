exports['webpack-file install template correctly generates plugins config when webpack config path is missing 1'] = `
const injectDevServer = require("@cypress/react/plugins/load-webpack");

const something = require("something");

module.exports = (on, config) => {
  // TODO replace with valid webpack config path
  config.env.webpackFilename = './webpack.config.js';
  injectDevServer(on, config);
  return config; // IMPORTANT to return the config object
};
`

exports['webpack-file install template correctly generates plugins config when webpack config path is provided 1'] = `
const injectDevServer = require("@cypress/react/plugins/load-webpack");

const something = require("something");

module.exports = (on, config) => {
  config.env.webpackFilename = 'config/webpack.config.js';
  injectDevServer(on, config);
  return config; // IMPORTANT to return the config object
};
`
