const { defineConfig } = require('cypress')
const { devServer, defineDevServerConfig } = require('@cypress/react/plugins/craco')

const cracoConfig = require('./craco.config.js')

module.exports = defineConfig({
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({ cracoConfig }),
    componentFolder: 'src',
    testFiles: '**/*.test.{js,ts,jsx,tsx}',
  },
})
