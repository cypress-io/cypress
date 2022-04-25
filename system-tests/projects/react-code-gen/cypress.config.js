const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    supportFile: 'cypress/component/support.js',
    specPattern: 'src/**/*.cy.{js,jsx}',
    devServer: {
      bundler: 'webpack',
    },
  },
  e2e: {
    supportFile: 'cypress/component/support.js',
  },
})
