module.exports = {
  component: {
    testFiles: '**/*cy-spec.{js,jsx,ts,tsx}',
    componentFolder: 'src',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      startDevServer({ options: cypressConfig, ...devServerConfig })
    },
    devServerConfig: {
      webpackConfig: {
        output: {
          publicPath: '/',
        },
      },
    },
  },
}
