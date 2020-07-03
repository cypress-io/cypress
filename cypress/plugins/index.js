/// <reference types="cypress" />
const preprocessor = require('../../plugins/webpack')
module.exports = (on, config) => {
  preprocessor(on, config)
  return config
}
