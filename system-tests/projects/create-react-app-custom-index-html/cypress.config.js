module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    indexHtmlFile: 'cypress/support/custom-component-index.html',
  },
}
