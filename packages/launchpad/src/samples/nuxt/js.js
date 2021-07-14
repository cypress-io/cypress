const { startDevServer } = require('@cypress/webpack-dev-server')
const { getWebpackConfig } = require('nuxt')

module.exports = {
  component (on, config) {
    on('dev-server:start', async (options) => {
      let webpackConfig = await getWebpackConfig('modern', 'dev')

      return startDevServer({
        options,
        webpackConfig,
      })
    })
  },
}
