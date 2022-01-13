const { defineConfig } = require('cypress')

module.exports = defineConfig({
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'component': {
    'supportFile': 'cypress/support/component.ts',
    devServer: require('@cypress/react/plugins/react-scripts'),
  },
})
