const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  component: {
    supportFile: 'cypress/component/support.js',
    specPattern: 'src/**/*.cy.{js,jsx}',
    devServer,
  },
  e2e: {
    supportFile: 'cypress/component/support.js',
  },
}
