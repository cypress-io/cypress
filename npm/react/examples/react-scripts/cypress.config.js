const { defineConfig } = require('cypress')

module.exports = defineConfig({
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'component': {
    devServer: require('@cypress/react/plugins/react-scripts'),
  },
})
