const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    excludeSpecPattern: '*.html',
    supportFile: 'cypress/support/e2e.js',
  },
  component: {
    excludeSpecPattern: '*.html',
    supportFile: 'cypress/support/e2e.js',
  },
})
