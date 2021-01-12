/// <reference types="cypress" />
const devServer = require('../../dist/plugins/webpack')

module.exports = (on, config) => {
  devServer(on, config, require('../../webpack.config'))

  return config
}
