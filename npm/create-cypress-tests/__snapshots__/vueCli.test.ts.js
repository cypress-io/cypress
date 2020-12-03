exports['vue webpack-file install template correctly generates plugins for vue-cli-service 1'] = `
const preprocessor = require("@cypress/vue/dist/plugins/webpack");

const something = require("something");

module.exports = (on, config) => {
  preprocessor(on, config); // IMPORTANT return the config object

  return config;
};
`
