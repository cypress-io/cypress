module.exports = {
  testFiles: '**/*.cy.{js,jsx}',
  componentFolder: 'cypress/component-tests',
  supportFile: 'cypress/component/support.js',
  component: {
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
  },
}
