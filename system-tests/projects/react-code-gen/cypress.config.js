module.exports = {
  supportFile: 'cypress/component/support.js',
  component: {
    specPattern: 'src/**/*.cy.{js,jsx}',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
  },
}
