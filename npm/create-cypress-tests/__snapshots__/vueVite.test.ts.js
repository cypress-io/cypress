exports['vue: vite template correctly generates plugins config 1'] = `
const {
  startDevServer
} = require("@cypress/vite-dev-server");

const something = require("something");

module.exports = (on, config) => {
  on("dev-server:start", async options => startDevServer({
    options
  }));
};
`
