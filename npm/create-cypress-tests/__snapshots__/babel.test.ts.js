exports['babel installation template correctly generates plugins config 1'] = `
const injectDevServer = require('@cypress/react/plugins/babel');

const something = require("something");

module.exports = (on, config) => {
  if (config.mode === "component") {
    injectDevServer(on, config);
  }

  return config; // IMPORTANT to return a config
};
`
