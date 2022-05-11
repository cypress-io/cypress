const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'abc1234',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    specPattern: 'src/**/*.{js,jsx,ts,tsx}',
  },
})
