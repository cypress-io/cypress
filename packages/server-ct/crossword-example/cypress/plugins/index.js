/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('devserver:start', (options) => startDevServer(options))

  return config
}
