exports['vue webpack-file install template correctly generates plugins for vue-cli-service 1'] = `
const injectDevServer = require("@cypress/vue/dist/plugins/webpack");

const something = require("something");

module.exports = (on, config) => {
  injectDevServer(on, config); // IMPORTANT return the config object

  return config;
};
`
