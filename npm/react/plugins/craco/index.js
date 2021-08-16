const returnInjectDevServerFunction = require('../utils/return-injectdevserver-function')
const { startDevServer } = require('@cypress/webpack-dev-server')
const { createWebpackDevConfig } = require('@craco/craco')

function startCracoDevServer (options, cracoConfig) {
  return startDevServer({ options, webpackConfig: createWebpackDevConfig(cracoConfig) })
}

module.exports = returnInjectDevServerFunction(startCracoDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})
