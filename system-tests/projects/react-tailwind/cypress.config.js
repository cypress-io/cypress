const { devServer } = require('@cypress/react/plugins/react-scripts')
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer,
    supportFile: false,
  },
})
