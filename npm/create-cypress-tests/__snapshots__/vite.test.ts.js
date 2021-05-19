exports['vue: vite template correctly generates plugins config 1'] = `
const {
  startDevServer
} = require("@cypress/vite-dev-server");

const something = require("something");

module.exports = (on, config) => {
  if (config.testingType === "component") {
    on("dev-server:start", async options => startDevServer({
      options
    }));
  }

  return config; // IMPORTANT to return a config
};
`
