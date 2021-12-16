module.exports = {
  component: {
    supportFile: false,
    testFiles: '**/*cy-spec.{js,jsx,ts,tsx}',
    componentFolder: 'src',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        options: cypressConfig,
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
