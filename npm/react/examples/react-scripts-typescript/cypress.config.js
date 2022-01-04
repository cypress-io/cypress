module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'component': {
    'supportFile': 'cypress/support/component.ts',
    'specPattern': 'src/**/*cy-spec.tsx',
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/react-scripts')

      devServer(on, config)

      return config
    },
  },
}
