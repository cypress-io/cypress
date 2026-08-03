const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5599',
    supportFile: false,
    fixturesFolder: false,
    video: false,
  },
})
