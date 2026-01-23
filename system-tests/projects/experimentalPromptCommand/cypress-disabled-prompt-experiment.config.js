const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    allowCypressEnv: false,
    supportFile: false,
  },
})
