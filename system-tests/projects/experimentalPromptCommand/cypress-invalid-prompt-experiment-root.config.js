const { defineConfig } = require('cypress')

module.exports = defineConfig({
  // This property is invalid as `experimentalStudio` is only available for e2e
  experimentalStudio: true,
  e2e: {
  },
})
