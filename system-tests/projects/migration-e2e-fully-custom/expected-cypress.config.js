const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents (on, config) {
      return require('src/the-plugins-file.js')(on, config)
    },
    specPattern: 'src/**/*.spec.js',
    supportFile: 'src/some-support-file.js',
  },
})
