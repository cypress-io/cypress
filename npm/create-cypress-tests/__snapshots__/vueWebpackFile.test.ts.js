exports['vue webpack-file install template correctly generates plugins config when webpack config path is missing 1'] = `
const {
  startDevServer
} = require("@cypress/webpack-dev-server");

const webpackConfig = require("./webpack.config.js"); // TODO replace with valid webpack config path


const something = require("something");

module.exports = (on, config) => {
  on('dev-server:start', options => startDevServer({
    options,
    webpackConfig
  }));
};
`

exports['vue webpack-file install template correctly generates plugins config when webpack config path is provided 1'] = `
const {
  startDevServer
} = require("@cypress/webpack-dev-server");

const webpackConfig = require("build/webpack.config.js");

const something = require("something");

module.exports = (on, config) => {
  on('dev-server:start', options => startDevServer({
    options,
    webpackConfig
  }));
};
`
