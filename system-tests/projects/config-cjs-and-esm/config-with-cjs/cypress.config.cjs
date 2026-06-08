const { defineConfig } = require('cypress')

// require must be present within a CJS context
require

module.exports = defineConfig({
  e2e: { supportFile: false },
})
