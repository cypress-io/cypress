module.exports = {
  retries: null,
  component: {
    supportFile: 'cypress/component/support/component.js',
    devServer (cypressDevServerConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({ options: cypressDevServerConfig })
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
