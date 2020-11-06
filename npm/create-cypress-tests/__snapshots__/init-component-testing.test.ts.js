exports['injected plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config); // IMPORTANT to return the config object

  return config;
};

`

exports['injected support/index.js'] = `
import "./commands.js";
import "@cypress/react/support";

`

exports['next.js template injected plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/next");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config;
};

`

exports['next.js template injected support/index.js'] = `
import "@cypress/react/support";

`

exports['create-react-app template injected plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config); // IMPORTANT to return the config object

  return config;
};

`

exports['create-react-app template injected support/index.js'] = `
import "./commands.js";
import "@cypress/react/support";

`

exports['create-react-app template injected cypress.json'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config); // IMPORTANT to return the config object

  return config;
};

`

exports['Injects guessed next.js template cypress.json'] = `
const preprocessor = require("@cypress/react/plugins/next");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config;
};

`

exports['Injects guessed next.js template plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/next");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config;
};

`

exports['Injects guessed next.js template support/index.js'] = `
import "@cypress/react/support";

`

exports['Injected overridden webpack template cypress.json'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config); // IMPORTANT to return the config object

  return config;
};

`

exports['Injected overridden webpack template plugins/index.js'] = `
const preprocessor = require("@cypress/react/plugins/react-scripts");

module.exports = (on, config) => {
  preprocessor(on, config); // IMPORTANT to return the config object

  return config;
};

`

exports['Injected overridden webpack template support/index.js'] = `
import "./commands.js";
import "@cypress/react/support";

`
