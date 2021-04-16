exports['vue webpack-file install template correctly generates plugins for vue-cli-service 1'] = `
const {
  startDevServer
} = require("@cypress/webpack-dev-server");

const webpackConfig = require("@vue/cli-service/webpack.config.js");

const something = require("something");

module.exports = (on, config) => {
  if (config.testingType === "component") {
    on('dev-server:start', options => startDevServer({
      options,
      webpackConfig
    }));
  }
};
`
