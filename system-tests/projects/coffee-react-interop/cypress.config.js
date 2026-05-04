const { defineConfig } = require('cypress')

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.{js,jsx,mjs,ts,tsx,coffee}',
    setupNodeEvents (on, config) {},
  },
})
