module.exports = {
  'componentFolder': 'src',
  e2e: {
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      const webpackConfig = {
        output: {
          publicPath: '/',
        },
      }

      require('@cypress/code-coverage/task')(on, config)
      on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

      return config
    },
  },
}
