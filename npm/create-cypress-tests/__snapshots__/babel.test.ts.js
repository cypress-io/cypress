exports['babel installation template correctly generates plugins config 1'] = `
const preprocessor = require('@cypress/react/plugins/babel');

const something = require("something");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config; // IMPORTANT to return the config object
};
`
