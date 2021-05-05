const { startDevServer } = require('@cypress/webpack-dev-server')
const { createWebpackDevConfig } = require('@craco/craco')

module.exports = (on, config, cracoConfig) => {
  if (!cracoConfig) {
    throw Error('craco config is required.')
  }

  on('dev-server:start', (options) => {
    return startDevServer({
      options,
      webpackConfig: createWebpackDevConfig(cracoConfig),
    })
  })

  return config
}
