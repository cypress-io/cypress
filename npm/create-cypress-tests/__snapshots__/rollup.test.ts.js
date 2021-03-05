exports['rollup-file install template correctly generates plugins config when webpack config path is missing 1'] = `
const rollupPreprocessor = require("@bahmutov/cy-rollup");

const something = require("something");

module.exports = (on, config) => {
  on('file:preprocessor', rollupPreprocessor({
    // TODO replace with valid rollup config path
    configFile: 'rollup.config.js'
  }));

  require('@cypress/code-coverage/task')(on, config);

  return config; // IMPORTANT to return the config object
};
`

exports['rollup-file install template correctly generates plugins config when webpack config path is provided 1'] = `
const rollupPreprocessor = require("@bahmutov/cy-rollup");

const something = require("something");

module.exports = (on, config) => {
  on('file:preprocessor', rollupPreprocessor({
    configFile: 'config/rollup.config.js'
  }));

  require('@cypress/code-coverage/task')(on, config);

  return config; // IMPORTANT to return the config object
};
`
