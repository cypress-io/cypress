const path = require('path')
const wrapDevServer = require('../utils/wrap-devserver')
const findNextWebpackConfig = require('./findNextWebpackConfig')

function startNextDevServer (options, { webpackFilename }) {
  const webpackConfig = await findNextWebpackConfig(options.config)

  // require('webpack') now points to nextjs bundled version
  const { startDevServer } = require('@cypress/webpack-dev-server')

  return startDevServer({
    options,
    webpackConfig,
    template: path.resolve(__dirname, 'index-template.html'),
  })
}

module.exports = wrapDevServer(startNextDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})
