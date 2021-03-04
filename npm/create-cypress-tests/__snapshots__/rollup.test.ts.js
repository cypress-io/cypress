exports['rollup-file install template correctly generates plugins config when webpack config path is missing 1'] = `
const path = require("path");

const {
  startDevServer
} = require("@cypress/rollup-dev-server");

const something = require("something");

module.exports = (on, config) => {
  on("dev-server:start", async options => {
    return startDevServer({
      options,
      // TODO replace with valid rollup config path
      rollupConfig: path.resolve(__dirname, 'rollup.config.js')
    });
  });
  return config; // IMPORTANT to return the config object
};
`

exports['rollup-file install template correctly generates plugins config when webpack config path is provided 1'] = `
const path = require("path");

const {
  startDevServer
} = require("@cypress/rollup-dev-server");

const something = require("something");

module.exports = (on, config) => {
  on("dev-server:start", async options => {
    return startDevServer({
      options,
      rollupConfig: path.resolve(__dirname, 'config/rollup.config.js')
    });
  });
  return config; // IMPORTANT to return the config object
};
`
