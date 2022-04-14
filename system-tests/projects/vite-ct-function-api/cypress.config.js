const { devServer } = require('../../../npm/vite-dev-server')

module.exports = {
  retries: null,
  component: {
    supportFile: 'cypress/component/support/component.js',
    devServer (cypressConfig) {
      return devServer(cypressConfig)
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
