exports['injects guessed next.js template cypress.config.ts'] = `
export default {
  componentFolder: "src",
  testFiles: "**/*.spec.{js,ts,jsx,tsx}"
};

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
export default {
  componentFolder: "cypress/component",
  testFiles: "**/*.spec.{js,ts,jsx,tsx}"
};

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

exports['Injected overridden webpack template support/component.js'] = `
import "./commands.js";
`
