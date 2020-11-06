exports['vue webpack-file install template correctly generates plugins config when webpack config path is missing 1'] = `
const {
  onFilePreprocessor
} = require('@cypress/vue/preprocessor/webpack');

const something = require("something");

module.exports = (on, config) => {
  // TODO replace with valid webpack config path
  on('file:preprocessor', onFilePreprocessor('./webpack.config.js'));
};
`

exports['vue webpack-file install template correctly generates plugins config when webpack config path is provided 1'] = `
const {
  onFilePreprocessor
} = require('@cypress/vue/preprocessor/webpack');

const something = require("something");

module.exports = (on, config) => {
  on('file:preprocessor', onFilePreprocessor('build/webpack.config.js'));
};
`
