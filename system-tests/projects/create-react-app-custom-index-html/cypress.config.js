const { devServer } = require('@cypress/react-scripts-dev-server')

module.exports = {
  component: {
    devServer,
    devServerConfig: {
      indexHtmlFile: 'cypress/support/component-index.html',
    },
  },
}
