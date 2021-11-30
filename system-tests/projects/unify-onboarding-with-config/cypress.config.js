module.exports = {
  component: {
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
}
