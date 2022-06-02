const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer: {
      framework: 'vue-cli',
      bundler: 'webpack',
    },
    indexHtmlFile: 'cypress/support/custom-component-index.html',
  },
})