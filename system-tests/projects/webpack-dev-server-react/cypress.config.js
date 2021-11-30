module.exports = {
  testFiles: 'src/**/*.cy.{js,jsx}',
  componentFolder: 'src',
  component: {
    componentFolder: 'src',
    testFiles: 'src/**/*.cy.{js,jsx}',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        webpackConfig: require('./webpack.config.js'),
        options: cypressConfig,
      })
    },
  },
}
