const { defineConfig } = require('cypress')

// @ts-check
const cracoConfig = require('../../craco.config.js')
const devServer = require('@cypress/react/plugins/craco')

module.exports = defineConfig({
  component: {
    testFiles: '**/*.test.{js,ts,jsx,tsx}',
    componentFolder: 'src',
  },
  component: {
    setupNodeEvents (on, config) {
      devServer(on, config, cracoConfig)

      return config
    },
  },
})
