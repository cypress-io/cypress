module.exports = {
  allowCypressEnv: false,
  retries: null,
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: 'cypress/component/support/component.ts',
    devServer: {
      bundler: 'vite',
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
