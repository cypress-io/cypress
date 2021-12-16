module.exports = {
  testFiles: '**/*.cy.{js,jsx}',
  componentFolder: 'src',
  component: {
    supportFile: 'cypress/component/support.js',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
  },
  e2e: {
    supportFile: 'cypress/component/support.js',
  },
}
