const { defineConfig } = require('cypress')

module.exports = defineConfig({
  experimentalRunAllSpecs: true,
  e2e: {
    supportFile: false,
  },
})
