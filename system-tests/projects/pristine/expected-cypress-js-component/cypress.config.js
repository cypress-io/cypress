const { devServer } = require('@cypress/react/plugins/react-scripts')

module.exports = {
  component: {
    devServer,
    devServerConfig: {
      indexHtmlFile: 'cypress/support/component-index.html',
    },
  },
}