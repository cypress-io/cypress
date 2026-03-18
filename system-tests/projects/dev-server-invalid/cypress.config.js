module.exports = {
  allowCypressEnv: false,
  retries: null,
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    devServer (cypressConfig) {},
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
