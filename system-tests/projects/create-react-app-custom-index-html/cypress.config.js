const { devServer } = require('@cypress/react/plugins/react-scripts')

module.exports = {
  component: {
    devServer,
    indexHtmlFile: 'cypress/support/custom-component-index.html',
  },
}
