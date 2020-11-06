exports['Injects guessed next.js template cypress.json'] = `
const preprocessor = require("@cypress/react/plugins/next");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config; // IMPORTANT to return the config object
};

`

exports['Injects guessed next.js template plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/next");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config; // IMPORTANT to return the config object
};

`

exports['Injects guessed next.js template support/index.js'] = `
import "@cypress/react/support";

`

exports['Injected overridden webpack template cypress.json'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config; // IMPORTANT to return the config object
};

`

exports['Injected overridden webpack template plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config; // IMPORTANT to return the config object
};

`

exports['Injected overridden webpack template support/index.js'] = `
import "./commands.js";
import "@cypress/react/support";

`
