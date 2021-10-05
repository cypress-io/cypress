const { defineConfig } = require('cypress')

module.exports = defineConfig({
  video: false,
  testFiles: '**/*.spec.{js,jsx}',
  viewportWidth: 500,
  viewportHeight: 800,
  componentFolder: 'cypress/components',
  pluginsFile: 'cypress/plugins.js',
})
