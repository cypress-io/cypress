/// <reference types="cypress" />
const preprocessor = require('../../dist/plugins/webpack')

module.exports = (on, config) => {
  preprocessor(on, config, require('../../webpack.config.js'))

  return config
}
