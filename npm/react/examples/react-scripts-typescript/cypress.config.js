const { defineConfig } = require('cypress')

const devServer = require('@cypress/react/plugins/react-scripts')

module.exports = defineConfig({
  video: false,
  testFiles: '**/*cy-spec.tsx',
  viewportWidth: 500,
  viewportHeight: 800,
  componentFolder: 'src',

  e2e: {
    setupNodeEvents (on, config) {
      devServer(on, config)

      return config
    },
  },
})
