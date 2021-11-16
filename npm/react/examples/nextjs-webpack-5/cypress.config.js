const { defineConfig } = require('cypress')

module.exports = defineConfig({
  video: false,
  viewportWidth: 500,
  viewportHeight: 800,
  pluginsFile: 'cypress/plugins.js',
  component: {
    componentFolder: 'cypress/components',
    specPattern: '**/*.spec.{js,jsx}',
  }
})
