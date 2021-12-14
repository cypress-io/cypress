module.exports = {
  testFiles: '**/*.cy.{js,jsx}',
  componentFolder: 'src',
  supportFile: 'cypress/component/support.js',
  component: {
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
  },
}
