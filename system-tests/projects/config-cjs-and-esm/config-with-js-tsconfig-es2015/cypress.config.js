const { defineConfig } = require('cypress')

// require must be present within a CJS context
require

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
  },
})
