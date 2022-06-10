const { defineConfig } = require('cypress')
const cypressWebpackDevServer = require('@cypress/webpack-dev-server').devServer

module.exports = defineConfig({
  component: {
    devServer: (devServerOptions) => {
      return cypressWebpackDevServer({
        ...devServerOptions,
        framework: 'react',
        bundler: 'webpack',
      })
    },
  },
})
