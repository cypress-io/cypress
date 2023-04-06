module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    devServer: {
      bundler: 'vite',
      framework: 'react',
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
}
