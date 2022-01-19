module.exports = {
  component: {
    supportFile: 'cypress/component/support.js',
    specPattern: 'src/**/*.cy.{js,jsx}',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
  },
  e2e: {
    supportFile: 'cypress/component/support.js',
  },
}
