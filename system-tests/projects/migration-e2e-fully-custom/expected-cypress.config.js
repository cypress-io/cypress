const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./src/the-plugins-file.js')(on, config)
    },
    specPattern: 'src/**/*.spec.js',
    supportFile: 'src/some-support-file.js',
  },
})
