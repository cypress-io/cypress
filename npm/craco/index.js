const { startDevServer } = require('@cypress/webpack-dev-server')
const { createWebpackDevConfig } = require('@craco/craco')

const devServer = (cypressDevServerConfig) => {
  process.env.FAST_REFRESH = 'false'

  const { config } = cypressDevServerConfig

  const cracoConfig = config.cracoConfig || {}

  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: createWebpackDevConfig(cracoConfig),
  })
}

module.exports.devServer = devServer
