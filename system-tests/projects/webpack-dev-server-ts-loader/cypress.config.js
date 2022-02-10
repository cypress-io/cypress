module.exports = {
  component: {
    supportFile: false,
    devServer (cypressDevServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      const webpackConfig = {
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              use: 'ts-loader',
              exclude: /node_modules/,
            },
          ],
        },
      }

      return startDevServer({
        webpackConfig,
        options: cypressDevServerConfig,
      })
    },
  },
}
