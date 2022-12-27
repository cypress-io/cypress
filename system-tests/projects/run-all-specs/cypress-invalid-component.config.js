const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    devServer () {
      return {
        port: 1234,
        close: () => {},
      }
    },
    experimentalRunAllSpecs: true,
    supportFile: false,
  },
})
