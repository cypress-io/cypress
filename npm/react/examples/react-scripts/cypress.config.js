const { defineConfig } = require('cypress')
const { devServer } = require('@cypress/react/plugins/react-scripts')

module.exports = defineConfig({
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'component': {
    devServer,
  },
})
