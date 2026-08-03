const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:12345',
    supportFile: false,
    fixturesFolder: false,
    video: false,
  },
})
