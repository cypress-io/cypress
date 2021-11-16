// @ts-check
const { defineConfig } = require('cypress')
const { devServer } = require('@cypress/react/plugins/next')

module.exports = defineConfig({
  video: false,
  viewportWidth: 500,
  viewportHeight: 800,
  experimentalFetchPolyfill: true,
  env: {
    coverage: true,
  },
  component: {
    devServer,
    componentFolder: 'cypress/components',
    specPattern: '**/*.spec.{js,jsx}',
  },
})
