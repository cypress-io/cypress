const wrapDevServer = require('../utils/wrap-devserver')
const { startDevServer } = require('@cypress/webpack-dev-server')
const { createWebpackDevConfig } = require('@craco/craco')

function startCracoDevServer (options, cracoConfig) {
  return startDevServer({ options, webpackConfig: createWebpackDevConfig(cracoConfig) })
}

module.exports = wrapDevServer(startCracoDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})
