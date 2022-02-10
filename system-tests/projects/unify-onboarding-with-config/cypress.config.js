module.exports = {
  component: {
    supportFile: false,
    testFiles: '**/*cy-spec.{js,jsx,ts,tsx}',
    componentFolder: 'src',
    devServer (cypressDevServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        options: cypressDevServerConfig,
        webpackConfig: {
          output: {
            publicPath: '/',
          },
        } })
    },
  },
  e2e: {
    supportFile: false,
  },
}
