exports['injects guessed next.js template cypress.config.ts'] = `
module.exports = {}
`

exports['injects guessed next.js template plugins/index.js'] = `
const injectDevServer = require("@cypress/react/plugins/next");

module.exports = (on, config) => {
  if (config.testingType === "component") {
    injectDevServer(on, config);
  }

  return config; // IMPORTANT to return a config
};

`

exports['Injected overridden webpack template cypress.config.ts'] = `
module.exports = {}
`

exports['Injected overridden webpack template plugins/index.js'] = `
const injectDevServer = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  if (config.testingType === "component") {
    injectDevServer(on, config);
  }

  return config; // IMPORTANT to return a config
};

`

exports['Injected overridden webpack template support/index.js'] = `
import "./commands.js";
`
