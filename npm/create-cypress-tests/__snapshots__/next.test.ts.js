exports['next.js install template correctly generates plugins config 1'] = `
const preprocessor = require('@cypress/react/plugins/next');

const something = require("something");

module.exports = (on, config) => {
  preprocessor(on, config);
  return config; // IMPORTANT to return the config object
};
`
