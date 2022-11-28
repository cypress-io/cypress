module.exports = {
  retries: null,
  component: {
    supportFile: 'cypress/component/support/component.js',
    devServer: {
      bundler: 'vite',
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
