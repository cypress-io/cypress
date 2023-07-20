const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    browser: 'chrome',
    supportFile: false,
  },
})
