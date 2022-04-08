const { devServer } = require('@cypress/react/plugins/load-webpack')

module.exports = {
  component: {
    supportFile: false,
    specPattern: 'src/specs-folder/*.cy.{js,jsx}',
    devServer,
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    supportFile: false,
    specPattern: 'src/**/*.cy.{js,jsx}',
  },
}
