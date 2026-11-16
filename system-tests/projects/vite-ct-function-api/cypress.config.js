const { devServer } = require('@cypress/vite-dev-server')

module.exports = {
  retries: null,
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: 'cypress/component/support/component.ts',
    devServer (cypressConfig) {
      return devServer(cypressConfig)
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
