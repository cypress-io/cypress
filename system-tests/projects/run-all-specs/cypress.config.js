const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    experimentalRunAllSpecs: true,
    supportFile: false,
  },
})
